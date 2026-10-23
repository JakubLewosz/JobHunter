"""Package an exact committed tree plus reviewed synthetic evidence. No providers."""
import argparse
import hashlib
import json
import pathlib
import re
import stat
import subprocess
import tempfile
import zipfile


def digest(data):
    return hashlib.sha256(data).hexdigest()


def git(*args):
    return subprocess.check_output(["git", *args], stderr=subprocess.PIPE)


def safe_name(name):
    path = pathlib.PurePosixPath(name)
    if not name or "\\" in name or ":" in name or path.is_absolute() or ".." in path.parts:
        raise ValueError("UNSAFE_ARCHIVE_PATH")
    return path


def inspect(archive):
    names = set()
    folded = set()
    for entry in archive.infolist():
        safe_name(entry.filename)
        if entry.filename.casefold() in folded or stat.S_ISLNK(entry.external_attr >> 16):
            raise ValueError("DUPLICATE_OR_SYMLINK")
        names.add(entry.filename)
        folded.add(entry.filename.casefold())
    return names


parser = argparse.ArgumentParser()
parser.add_argument("--base", required=True)
parser.add_argument("--commit", required=True)
parser.add_argument("--evidence", required=True)
parser.add_argument("--output", required=True)
parser.add_argument("--ci", required=True)
parser.add_argument("--report", default="docs/reviews/WINDOWS_NIGHTFLOW_IMPLEMENTATION.md")
parser.add_argument("--extra-evidence")
parser.add_argument("--label", default="windows_nightflow")
args = parser.parse_args()
safe_name(args.report)
if not re.fullmatch(r"[A-Za-z0-9_-]{1,50}", args.label):
    raise ValueError("INVALID_LABEL")
if not all(re.fullmatch(r"[0-9a-f]{40}", ref) for ref in [args.base, args.commit]):
    raise ValueError("EXACT_COMMIT_REQUIRED")
if git("rev-parse", "HEAD").decode().strip() != args.commit:
    raise ValueError("HEAD_MISMATCH")
git("diff", "--exit-code", "HEAD", "--")
evidence = pathlib.Path(args.evidence).resolve()
summary = json.loads((evidence / "test-summary.json").read_text(encoding="utf-8"))
tested = json.loads((evidence / "source-files.json").read_text(encoding="utf-8"))
if summary["exitCode"] != 0 or not summary["unchanged"]:
    raise ValueError("FINAL_CHECK_NOT_PASS")
calculated = digest(json.dumps(tested["files"], ensure_ascii=False, separators=(",", ":")).encode())
if calculated != tested["fingerprint"] or calculated != summary["sourceFingerprint"]:
    raise ValueError("TEST_MANIFEST_MISMATCH")
output = pathlib.Path(args.output).resolve()
output.mkdir(parents=True, exist_ok=True)
stage = pathlib.Path(tempfile.mkdtemp(prefix="nightflow-stage-", dir=output))
package = stage / "package"
package.mkdir()
source_archive = stage / "source.zip"
subprocess.check_call(["git", "archive", "--format=zip", "--prefix=source/", f"--output={source_archive}", args.commit])
with zipfile.ZipFile(source_archive) as archive:
    inspect(archive)
    archive.extractall(package)

# Verify every archived file against its Git blob, independently of ZIP success.
tree = {}
for record in git("ls-tree", "-r", "-z", "--full-tree", args.commit).split(b"\0"):
    if not record:
        continue
    head, raw_path = record.split(b"\t", 1)
    mode, kind, oid = head.split()
    path = raw_path.decode("utf-8")
    safe_name(path)
    if kind != b"blob" or mode not in [b"100644", b"100755"]:
        raise ValueError("UNSUPPORTED_TREE_ENTRY")
    tree[path] = oid.decode()
actual_sources = {p.relative_to(package / "source").as_posix() for p in (package / "source").rglob("*") if p.is_file()}
if actual_sources != set(tree):
    raise ValueError("SOURCE_TREE_INCOMPLETE")
for path, oid in tree.items():
    parts = pathlib.PurePosixPath(path).parts
    if ".git" in parts or "node_modules" in parts or path.startswith(("runtime/", "data/", "dist/")) or re.search(r"\.(?:sqlite(?:-wal|-shm)?|eml|pdf|pem|key)$", path, re.I):
        raise ValueError("FORBIDDEN_SOURCE_ARTIFACT")
    data = (package / "source" / path).read_bytes()
    if hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest() != oid:
        raise ValueError("SOURCE_BLOB_MISMATCH")
for entry in tested["files"]:
    data = (package / "source" / entry["path"]).read_bytes()
    if len(data) != entry["bytes"] or digest(data) != entry["sha256"]:
        raise ValueError("FINAL_COMMIT_DIFFERS_FROM_TESTED_CODE")

review = package / "review"
review.mkdir()
ci = json.loads(pathlib.Path(args.ci).read_text(encoding="utf-8"))
report = (package / "source" / args.report).read_text(encoding="utf-8")
(review / "REPORT.md").write_text(report + "\n\n## Metadane przekazania\n\n" + f"Baza `{args.base}`, finalny commit `{args.commit}`.\n\nCI dla finalnego SHA:\n\n```json\n" + json.dumps(ci, indent=2, ensure_ascii=False) + "\n```\n", encoding="utf-8")
(review / "changes.patch").write_bytes(git("diff", "--binary", "--full-index", args.base, args.commit, "--"))
for name in ["test-summary.json", "source-files.json", "stop-measurements.json"]:
    (review / name).write_bytes((evidence / name).read_bytes())
(review / "ci.json").write_text(json.dumps(ci, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
(review / "COMMIT.json").write_text(json.dumps({"base": args.base, "commit": args.commit,
    "url": f"https://github.com/JakubLewosz/JobHunter/commit/{args.commit}",
    "sourceFingerprint": tested["fingerprint"]}, indent=2) + "\n", encoding="utf-8")
if args.extra_evidence:
    extra = pathlib.Path(args.extra_evidence).resolve()
    target = review / "evidence"
    target.mkdir()
    for path in sorted(extra.iterdir()):
        if path.is_symlink() or not path.is_file() or path.suffix.lower() not in [".json", ".txt", ".png"]:
            raise ValueError("UNREVIEWED_EXTRA_EVIDENCE")
        safe_name(path.name)
        (target / path.name).write_bytes(path.read_bytes())
history = evidence.parent / "verification-history.json"
if history.exists():
    (review / "verification-history.json").write_bytes(history.read_bytes())
start = f"""# REVIEW START

Base: `{args.base}`
Final: `{args.commit}`
Branch: `codex/windows-nightflow-fixes`
Commit: https://github.com/JakubLewosz/JobHunter/commit/{args.commit}
Tested code fingerprint: `{tested['fingerprint']}`

Windows check: actual `npm run check`, exit {summary['exitCode']}; isolated
synthetic HOME/data and complete fake providers. Test metadata retains its
true pre-commit identity. Every tested source file equals the final Git blob.
CI is reported independently in review/ci.json, not inferred from local PASS.

Start with review/REPORT.md, review/test-summary.json, review/changes.patch and
review/stop-measurements.json. source/ is the complete exact committed tree,
including migrations, tests, lockfile and already published redacted snapshots.
No deployment, production migration/research/mail/Gmail/CV or private database.
Real Codex/browser host results and their limits are recorded in review/REPORT.md
and the selected review/evidence files; do not infer them from this template.

FILE_MANIFEST.json hashes every other file. Its own recursive hash is omitted;
the ZIP SHA-256 is recorded outside the archive.
"""
(package / "REVIEW_START.md").write_text(start, encoding="utf-8")
manifest = []
for path in sorted(package.rglob("*")):
    if path.is_symlink():
        raise ValueError("SYMLINK_IN_STAGING")
    if path.is_file():
        data = path.read_bytes()
        manifest.append({"path": path.relative_to(package).as_posix(), "bytes": len(data), "sha256": digest(data)})
(package / "FILE_MANIFEST.json").write_text(json.dumps({"schema": 1, "base": args.base, "commit": args.commit, "selfHash": "OMITTED", "files": manifest}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
zip_path = output / f"JobHunter_{args.label}_{args.commit[:12]}_review.zip"
with zipfile.ZipFile(zip_path, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in sorted(package.rglob("*")):
        if path.is_file():
            archive.write(path, path.relative_to(package).as_posix())
verified = pathlib.Path(tempfile.mkdtemp(prefix="nightflow-verified-", dir=output))
with zipfile.ZipFile(zip_path) as archive:
    names = inspect(archive)
    if archive.testzip() is not None:
        raise ValueError("ZIP_CRC_FAILED")
    if names != {entry["path"] for entry in manifest} | {"FILE_MANIFEST.json"}:
        raise ValueError("ZIP_INCOMPLETE")
    archive.extractall(verified)
for entry in manifest:
    data = (verified / entry["path"]).read_bytes()
    if len(data) != entry["bytes"] or digest(data) != entry["sha256"]:
        raise ValueError("EXTRACTED_MANIFEST_MISMATCH")
# Independently reconstruct the final tree from the real base and binary patch.
patch_copy = pathlib.Path(tempfile.mkdtemp(prefix="patch-verified-", dir=output))
base_zip = stage / "base.zip"
subprocess.check_call(["git", "archive", "--format=zip", f"--output={base_zip}", args.base])
with zipfile.ZipFile(base_zip) as archive:
    inspect(archive)
    archive.extractall(patch_copy)
subprocess.check_call(["git", "init", "--quiet", str(patch_copy)])
subprocess.check_call(["git", "apply", "--check", str(review / "changes.patch")], cwd=patch_copy)
subprocess.check_call(["git", "apply", str(review / "changes.patch")], cwd=patch_copy)
rebuilt = {p.relative_to(patch_copy).as_posix() for p in patch_copy.rglob("*") if p.is_file() and ".git" not in p.relative_to(patch_copy).parts}
if rebuilt != set(tree):
    raise ValueError("PATCH_FILE_SET_MISMATCH")
for path in tree:
    if (patch_copy / path).read_bytes() != (verified / "source" / path).read_bytes():
        raise ValueError("PATCH_RECONSTRUCTION_MISMATCH")
result = {"schema": 1, "zip": zip_path.name, "bytes": zip_path.stat().st_size, "sha256": digest(zip_path.read_bytes()), "commit": args.commit, "sourceFiles": len(tree), "manifestFiles": len(manifest), "testedCodeFilesVerified": len(tested["files"]), "safePaths": True, "reExtracted": True, "gitBlobsVerified": True, "manifestVerified": True, "patchReconstructed": True, "patchFilesVerified": len(rebuilt)}
(output / f"{zip_path.stem}.verification.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result))

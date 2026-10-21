export function localFixtureOrigin(value: string) {
  const u = new URL(value);
  if (
    u.origin !== value ||
    u.protocol !== 'http:' ||
    u.hostname !== '127.0.0.1' ||
    !u.port ||
    u.username ||
    u.password
  )
    throw Error('LOCAL_FIXTURE_ORIGIN');
  return value;
}

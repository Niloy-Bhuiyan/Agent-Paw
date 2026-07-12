/** Fixed retro background: 32px grid with radial mask + CRT scanlines. */
export function BackgroundFX() {
  return (
    <>
      <div className="grid-bg" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />
    </>
  );
}

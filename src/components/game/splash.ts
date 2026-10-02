import screens from './splash-screens.json'

export const GAME_ASSET_DIR = '/icons/game'

export type SplashImage = { url: string; media: string }

// iOS picks a launch image only on an exact media match, and shows a blank
// screen otherwise, so each device size needs its own file per orientation.
export function splashImages(): SplashImage[] {
  return screens.flatMap(({ width, height, ratio }) =>
    (['portrait', 'landscape'] as const).map((orientation) => {
      const [w, h] =
        orientation === 'portrait'
          ? [width * ratio, height * ratio]
          : [height * ratio, width * ratio]
      return {
        url: `${GAME_ASSET_DIR}/splash-${w}x${h}.png`,
        media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: ${orientation})`,
      }
    })
  )
}

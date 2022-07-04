import { AssetLoader, prepareLoad } from './limbo/core/assets';
import { gridBasedSpriteSheetData } from './limbo/data/grid-based-sprite-sheet-data';
import WebFont from 'webfontloader';

/**
 * This function runs right before we start loading.
 * Use this to prepare assets that need to be loaded.
 * 
 * Use the `prepareLoad` function to prepare assets.
 *
 * @export
 */
export function preload() {
    prepareLoad(AssetLoader.Sound, "ouch", "ouch.ogg")
    WebFont.load({
        google: {
            families: ['Roboto']
        }
    });
}
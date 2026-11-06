import type { Score } from '@coderline/alphatab/model/Score';
import type { EffectBand } from '@coderline/alphatab/rendering/EffectBand';
import { ScoreRenderer } from '@coderline/alphatab/rendering/ScoreRenderer';
import { Settings } from '@coderline/alphatab/Settings';
import { VisualTestHelper } from 'test/visualTests/VisualTestHelper';
import { describe, expect, it } from 'vitest';

/**
 * Lattes fork: free text above the staff (chord symbols written as text) forms one row per staff, at its own
 * distance from the content below.
 */
describe('TextEffectRowTests', () => {
    // a low note and a high note with beams: per note the texts would sit at different heights
    const tex = `
        \\staff {score}
        :4 c4{txt "Do"} d4 e4 f4 | :8 a5{txt "Fa"} b5 c6 d6 :4 c6 b5 | :4 c4{txt "Sol"} d4 e4 f4
    `;

    async function textBands(configure?: (settings: Settings) => void, source: string = tex): Promise<EffectBand[]> {
        const settings = new Settings();
        VisualTestHelper.prepareSettingsForTest(settings);
        configure?.(settings);
        const score: Score = await VisualTestHelper.loadTex(source, settings);
        const renderer = new ScoreRenderer(settings);
        renderer.width = 1300;
        renderer.error.on(e => {
            throw e;
        });
        renderer.renderScore(score, [0]);
        const staff = renderer.layout!.systems[0].allStaves[0];
        const bands: EffectBand[] = [];
        for (const r of staff.barRenderers) {
            for (const b of r.topEffects.bands) {
                if (!b.isEmpty && b.info.effectId === 'EffectText') {
                    bands.push(b);
                }
            }
        }
        return bands;
    }

    it('texts-share-one-row', async () => {
        const bands = await textBands();
        expect(bands.length).toBe(3);
        for (const b of bands) {
            expect(b.placedMagnitude).toBe(bands[0].placedMagnitude);
        }
    });

    it('texts-share-one-baseline', async () => {
        // the flat is outside the measured characters: it must not make its text taller than the others
        const bands = await textBands(
            undefined,
            `
            \\staff {score}
            :4 c4{txt "Do"} d4 e4 f4 | :4 c4{txt "Si♭"} d4 e4 f4 | :4 c4{txt "Sol(add9)"} d4 e4 f4
            `
        );
        expect(bands.length).toBe(3);
        for (const b of bands) {
            expect(b.height).toBe(bands[0].height);
            expect(b.y).toBe(bands[0].y);
        }
    });

    it('row-uses-its-own-padding', async () => {
        const standard = await textBands();
        const wider = await textBands(s => {
            s.display.effectTextPaddingBottom = 17;
        });
        expect(wider[0].placedMagnitude - standard[0].placedMagnitude).toBeCloseTo(12, 5);
    });
});

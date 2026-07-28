import { describe, expect, it } from 'vitest';
import { MusicXmlImporter } from '@coderline/alphatab/importer/MusicXmlImporter';
import { ByteBuffer } from '@coderline/alphatab/io/ByteBuffer';
import { Settings } from '@coderline/alphatab/Settings';

function loadLyrics(notes: string): string[] {
    const xml = `<?xml version="1.0"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>P</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes>
      <divisions>1</divisions><key><fifths>0</fifths></key>
      <time><beats>4</beats><beat-type>4</beat-type></time>
      <clef><sign>G</sign><line>2</line></clef>
    </attributes>
    ${notes}
  </measure></part>
</score-partwise>`;

    const importer = new MusicXmlImporter();
    importer.init(ByteBuffer.fromBuffer(new TextEncoder().encode(xml)), new Settings());
    const score = importer.readScore();
    return score.tracks[0].staves[0].bars[0].voices[0].beats.map(b => (b.lyrics ? b.lyrics[0] : ''));
}

function note(step: string, lyric: string): string {
    return `<note><pitch><step>${step}</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type>${lyric}</note>`;
}

describe('MusicXmlImporter - syllabic', () => {
    it('marks continued syllables with a trailing dash', () => {
        // "O-gni not-te": begin/middle continue the word, end/single terminate it.
        const lyrics = loadLyrics(
            note('C', '<lyric number="1"><syllabic>begin</syllabic><text>O</text></lyric>') +
                note('D', '<lyric number="1"><syllabic>end</syllabic><text>gni</text></lyric>') +
                note('E', '<lyric number="1"><syllabic>begin</syllabic><text>not</text></lyric>') +
                note('F', '<lyric number="1"><syllabic>end</syllabic><text>te</text></lyric>')
        );
        expect(lyrics.slice(0, 4)).toEqual(['O-', 'gni', 'not-', 'te']);
    });

    it('keeps single syllables and middle syllables apart', () => {
        const lyrics = loadLyrics(
            note('C', '<lyric number="1"><syllabic>single</syllabic><text>sei</text></lyric>') +
                note('D', '<lyric number="1"><syllabic>middle</syllabic><text>ri</text></lyric>')
        );
        expect(lyrics.slice(0, 2)).toEqual(['sei', 'ri-']);
    });

    it('applies the syllabic only to the text right after it (elisions)', () => {
        // On an elision a single <lyric> holds multiple syllabic/text pairs.
        const lyrics = loadLyrics(
            note(
                'C',
                '<lyric number="1"><syllabic>end</syllabic><text>la</text><elision>‿</elision><syllabic>single</syllabic><text>in</text></lyric>'
            )
        );
        expect(lyrics[0]).toBe('la‿in');
    });

    it('leaves lyrics without syllabic untouched', () => {
        const lyrics = loadLyrics(
            note('C', '<lyric number="1"><text>ciao</text></lyric>') +
                note('D', '<lyric number="1"><text>bar</text></lyric>')
        );
        expect(lyrics.slice(0, 2)).toEqual(['ciao', 'bar']);
    });
});

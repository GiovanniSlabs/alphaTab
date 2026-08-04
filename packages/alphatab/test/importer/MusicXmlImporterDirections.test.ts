import { describe, expect, it } from 'vitest';
import { MusicXmlImporter } from '@coderline/alphatab/importer/MusicXmlImporter';
import { ByteBuffer } from '@coderline/alphatab/io/ByteBuffer';
import { Settings } from '@coderline/alphatab/Settings';

function firstBeatText(directionType: string): string {
    const xml = `<?xml version="1.0"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>P</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes>
      <divisions>1</divisions><key><fifths>0</fifths></key>
      <time><beats>4</beats><beat-type>4</beat-type></time>
      <clef><sign>G</sign><line>2</line></clef>
    </attributes>
    <direction placement="above"><direction-type>${directionType}</direction-type></direction>
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
  </measure></part>
</score-partwise>`;

    const importer = new MusicXmlImporter();
    importer.init(ByteBuffer.fromBuffer(new TextEncoder().encode(xml)), new Settings());
    const score = importer.readScore();
    return score.tracks[0].staves[0].bars[0].voices[0].beats[0].text ?? '';
}

describe('MusicXmlImporter - directions', () => {
    it('joins multiple <words> of the same direction', () => {
        // Exporters split a chord symbol into the text plus a music glyph for the
        // accidental: keeping only the last part would lose the chord name.
        expect(firstBeatText('<words>Si</words><words></words>')).toBe('Si♭');
    });

    it('keeps a single <words> unchanged', () => {
        expect(firstBeatText('<words>Do</words>')).toBe('Do');
    });

    it('maps music-font accidentals in text to standard unicode', () => {
        // The accidental of a chord symbol arrives as a SMuFL code point from a
        // music font: kept as-is it would only render with that same font.
        expect(firstBeatText('<words>Si</words><words>\ue260</words>')).toBe('Si\u266d');
        expect(firstBeatText('<words>Fa\ue262</words>')).toBe('Fa\u266f');
    });
});

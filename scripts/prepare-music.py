"""Rebuild the short soundtrack from the sender's source MP3 using FFmpeg.

python scripts/prepare-music.py --input "path/to/source.mp3" --ffmpeg "path/to/ffmpeg"
Only the music object in greeting.json is updated; recipient/letter edits are preserved.
"""
import argparse
import json
import shutil
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--input', required=True, type=Path)
parser.add_argument('--ffmpeg', default=shutil.which('ffmpeg'))
args = parser.parse_args()
if not args.input.is_file():
    parser.error('Source MP3 does not exist.')
if not args.ffmpeg:
    parser.error('Install FFmpeg or pass --ffmpeg with its executable path.')

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
edit = json.loads((root / 'music-edit.json').read_text(encoding='utf-8'))
output = (dist / edit['output']).resolve()
output.relative_to(dist.resolve())
output.parent.mkdir(parents=True, exist_ok=True)
filters = ['[0:a]asplit=4[s0][s1][s2][s3]']
cues = {}
position = 0
for index, clip in enumerate(edit['clips']):
    duration = clip['end'] - clip['start']
    if duration <= 0:
        raise ValueError('Invalid clip duration')
    filters.append(f"[s{index}]atrim=start={clip['start']}:end={clip['end']},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.01,afade=t=out:st={duration-0.025}:d=0.025[a{index}]")
    cues[clip['phase']] = {'start': position, 'end': position + duration}
    position += duration
filters.append('[a0][a1][a2][a3]concat=n=4:v=0:a=1[out]')
command = [str(args.ffmpeg), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(args.input.resolve()), '-filter_complex', ';'.join(filters), '-map', '[out]', '-vn', '-map_metadata', '-1', '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100', '-ac', '2', '-id3v2_version', '3', '-metadata', 'title=Anh nang cua anh - Nen & Hoa edit', '-metadata', 'artist=Duc Phuc', '-metadata', 'composer=Khac Hung', str(output)]
subprocess.run(command, check=True)

json_path = dist / 'greeting.json'
data = json.loads(json_path.read_text(encoding='utf-8'))
data.setdefault('music', {}).update({'src': edit['output'], 'ambientSrc': '', 'volume': 0.5, 'loop': True, 'crossfade': edit['crossfade'], 'cues': cues, 'credit': edit['credit']})
json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Exported {position:.3f}s, {output.stat().st_size} bytes; kept recipient and letter content unchanged.')

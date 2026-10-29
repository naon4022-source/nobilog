"""Mac内蔵音声の比較用補正。声の自然さや採用を自動決定しない。"""
import argparse, os, subprocess, wave
from pathlib import Path
FILTER = 'highpass=f=70,equalizer=f=350:t=q:w=0.8:g=-2,equalizer=f=2600:t=q:w=0.8:g=1.8,acompressor=threshold=0.1:ratio=1.5:attack=15:release=150:makeup=1,loudnorm=I=-18:TP=-2:LRA=7'
FILTER_LIGHT = 'highpass=f=70,equalizer=f=350:t=q:w=0.8:g=-1.5,equalizer=f=2600:t=q:w=0.8:g=1,loudnorm=I=-18:TP=-2:LRA=7'
def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('input',type=Path);ap.add_argument('output',type=Path);ap.add_argument('--profile',choices=['light','clear'],default='clear');a=ap.parse_args()
    if a.input.resolve()==a.output.resolve():ap.error('元音声を上書きせず、別の出力ファイルを指定してください')
    if a.output.exists():ap.error('出力先が存在します。別のファイルを指定してください')
    with wave.open(str(a.input)) as w:before=w.getnframes()/w.getframerate()
    ff=Path(os.environ.get('FFMPEG','/tmp/nobilog-media-tools/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1'))
    if not ff.is_file():ap.error('FFMPEGに利用可能なffmpegのパスを設定してください')
    subprocess.run([str(ff),'-nostdin','-n','-i',str(a.input),'-af',FILTER_LIGHT if a.profile=='light' else FILTER,'-ar','24000','-c:a','pcm_s16le',str(a.output)],check=True,capture_output=True)
    with wave.open(str(a.output)) as w:after=w.getnframes()/w.getframerate()
    if abs(after-before)>1/24000+1e-6:raise RuntimeError('補正前後の長さが違います。動画へ組み込まず確認してください')
    print('音域と音量の補正完了。声の自然さは試聴で確認してください。')
if __name__=='__main__':main()

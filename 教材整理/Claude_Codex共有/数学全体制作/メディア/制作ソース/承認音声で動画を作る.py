# -*- coding: utf-8 -*-
"""共有make_video.pyをそのまま使い、描画部分のみ同画素のキャンバス取得にする。
共有エンジンのファイル、音声処理、台本、30fpsを変更しない。
引数：場面.html 台本.json 出力.mp4 コマ保存先
"""
from pathlib import Path
import runpy, subprocess, wave, array, fcntl, tempfile, os
here=Path(__file__).resolve().parent
# 再起動で消える /tmp に制作ツールを置かず、固定版のローカルツールを使う。
if not os.environ.get('FFMPEG'):
    binaries=list((here/'制作ツール/imageio_ffmpeg/binaries').glob('ffmpeg-macos-*'))
    if len(binaries)!=1:raise RuntimeError('制作用ffmpegが見つかりません。音声の生成前に停止しました。')
    os.environ['FFMPEG']=str(binaries[0])
validate_audio=runpy.run_path(str(here/'音声実体を検証.py'))['validate']
original_run=subprocess.run
def run(args,*a,**kw):
    if isinstance(args,list) and len(args)>1 and args[0]=='node' and Path(args[1]).name=='render.mjs':
        args=[args[0],str(here/'動画を描画_キャンバス.mjs'),*args[2:]]
    if isinstance(args,list) and args and args[0]=='say':
        # Macの同じ読み上げ機能へ同時投入せず、音声だけ順番に作る。
        kw.setdefault('timeout',85)
        with (Path(tempfile.gettempdir())/'nobilog-kyoko-generation.lock').open('a') as guard:
            fcntl.flock(guard,fcntl.LOCK_EX)
            # 終了・タイムアウトを確認した後だけ、同じ文を1度再試行する。
            # 2度失敗した場合は、空音声の動画へ進まず停止する。
            for attempt in range(2):
                try:
                    result=original_run(args,*a,**kw)
                    if '-o' in args:validate_audio(Path(args[args.index('-o')+1]))
                    break
                except (subprocess.TimeoutExpired,subprocess.CalledProcessError,RuntimeError):
                    if attempt:raise
                    print('音声生成の終了を確認。同じ文を1度再試行します。',flush=True)
    else:
        result=original_run(args,*a,**kw)
    if isinstance(args,list) and args and args[0]=='say' and '-o' in args:
        path=Path(args[args.index('-o')+1])
        validate_audio(path)
    return result
subprocess.run=run
try:
    runpy.run_path(str(here/'動画エンジン/make_video.py'),run_name='__main__')
finally:
    subprocess.run=original_run

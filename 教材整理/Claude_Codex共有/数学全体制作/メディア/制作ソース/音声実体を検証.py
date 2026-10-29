# -*- coding: utf-8 -*-
"""終了コードだけに頼らず、音声の長さとPCMの振幅を検査する。"""
from pathlib import Path
import wave,array,sys,math,tempfile

def validate(path):
    with wave.open(str(path)) as audio:
        if audio.getsampwidth()!=2:raise ValueError('検査対象は16bit PCM WAVです')
        duration=audio.getnframes()/audio.getframerate()
        pcm=array.array('h',audio.readframes(audio.getnframes()))
    if duration<.2 or not pcm or max(abs(v) for v in pcm)<16:
        raise RuntimeError('Mac音声合成が空または無音です。動画を完成扱いせず停止しました。')
    return {'duration':duration,'peakPcm':max(abs(v) for v in pcm)}

def selftest():
    checks=0
    with tempfile.TemporaryDirectory(prefix='nobi-audio-guard-') as td:
        for name,frames,expect in [('empty',[],False),('silent',[0]*24000,False),('tooShort',[1000]*1200,False),('tone',[int(1000*math.sin(i*.1)) for i in range(24000)],True)]:
            p=Path(td)/(name+'.wav')
            with wave.open(str(p),'wb') as w:w.setparams((1,2,24000,0,'NONE',''));w.writeframes(array.array('h',frames).tobytes())
            try:validate(p);actual=True
            except RuntimeError:actual=False
            assert actual==expect,name;checks+=1
    print('音声実体の検査：4ケース成功（空・無音・短すぎる音を拒否、通常音を許可）')

if __name__=='__main__':
    if len(sys.argv)==2 and sys.argv[1]=='--selftest':selftest()
    else:print(validate(sys.argv[1]))

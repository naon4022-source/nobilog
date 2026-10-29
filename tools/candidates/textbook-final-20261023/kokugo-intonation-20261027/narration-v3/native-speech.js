// Local file synthesis through the native API; no GUI, service restart or shared setting changes.
ObjC.import('AppKit');
ObjC.import('Foundation');
function run(argv){
 if(argv.length!==2)throw Error('Expected local AIFF path and public teaching narration');
 const choices=ObjC.deepUnwrap($.NSSpeechSynthesizer.availableVoices).filter(identifier=>{
  const attrs=$.NSSpeechSynthesizer.attributesForVoice(identifier);
  return ObjC.unwrap(attrs.objectForKey($.NSVoiceName))==='Kyoko';
 });
 if(choices.length!==1)throw Error('Exact Kyoko voice is not uniquely available');
 const synth=$.NSSpeechSynthesizer.alloc.initWithVoice(choices[0]);
 if(!synth)throw Error('Kyoko initialization failed');
 synth.setRate(175);
 const began=Date.now(),started=synth.startSpeakingStringToURL(argv[1],$.NSURL.fileURLWithPath(argv[0]));
 if(!started)throw Error('Native file speech did not start');
 while(Date.now()-began<2000||synth.isSpeaking){
  if(Date.now()-began>180000){synth.stopSpeaking;throw Error('Own file synthesis timed out');}
  $.NSRunLoop.currentRunLoop.runUntilDate($.NSDate.dateWithTimeIntervalSinceNow(.1));
 }
 return JSON.stringify({status:'native synthesis returned; audio validation required',voice:choices[0],rate:175,elapsedMs:Date.now()-began});
}

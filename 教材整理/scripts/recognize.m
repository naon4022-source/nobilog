#import <Foundation/Foundation.h>
#import <Vision/Vision.h>
int main(int argc,const char *argv[]){@autoreleasepool{
 NSArray *files=[NSJSONSerialization JSONObjectWithData:[NSData dataWithContentsOfFile:@(argv[1])] options:0 error:nil];
 NSString *dir=@(argv[2]);[[NSFileManager defaultManager] createDirectoryAtPath:dir withIntermediateDirectories:YES attributes:nil error:nil];
 for(NSUInteger i=argc>3?atoi(argv[3]):0;i<files.count;i+=(argc>4?atoi(argv[4]):1)){@autoreleasepool{
 NSString *out=[dir stringByAppendingPathComponent:[NSString stringWithFormat:@"%04lu.json",(unsigned long)i]];
 if([[NSFileManager defaultManager] fileExistsAtPath:out])continue;
 VNRecognizeTextRequest *req=[VNRecognizeTextRequest new];req.recognitionLevel=VNRequestTextRecognitionLevelAccurate;req.recognitionLanguages=@[@"ja-JP",@"en-US"];req.usesLanguageCorrection=YES;
 NSError *err=nil;VNImageRequestHandler *handler=[[VNImageRequestHandler alloc] initWithURL:[NSURL fileURLWithPath:files[i]] options:@{}];
 if(![handler performRequests:@[req] error:&err]){printf("ERROR %lu\n",(unsigned long)i);fflush(stdout);continue;}
 NSMutableArray *lines=[NSMutableArray new];for(VNRecognizedTextObservation *o in req.results){VNRecognizedText *t=[[o topCandidates:1] firstObject];if(t){CGRect b=o.boundingBox;[lines addObject:@{@"text":t.string,@"confidence":@(t.confidence),@"x":@(b.origin.x),@"y":@(b.origin.y),@"w":@(b.size.width),@"h":@(b.size.height)}];}}
 NSData *data=[NSJSONSerialization dataWithJSONObject:@{@"file":files[i],@"lines":lines} options:NSJSONWritingPrettyPrinted error:nil];[data writeToFile:out atomically:YES];printf("%lu/%lu\n",(unsigned long)i+1,(unsigned long)files.count);fflush(stdout);
 }}return 0;}}

import Foundation
import Vision
import AppKit
let args=CommandLine.arguments
let paths=try JSONDecoder().decode([String].self,from:Data(contentsOf:URL(fileURLWithPath:args[1])))
let dir=URL(fileURLWithPath:args[2]);try FileManager.default.createDirectory(at:dir,withIntermediateDirectories:true)
for (i,path) in paths.enumerated(){
 let out=dir.appendingPathComponent(String(format:"%04d.json",i))
 if FileManager.default.fileExists(atPath:out.path){continue}
 do {
 let request=VNRecognizeTextRequest();request.recognitionLevel = .accurate;request.recognitionLanguages=["ja-JP","en-US"];request.usesLanguageCorrection=true
 try VNImageRequestHandler(url:URL(fileURLWithPath:path)).perform([request])
 let rows=(request.results ?? []).compactMap { o -> [String:Any]? in guard let c=o.topCandidates(1).first else{return nil};return ["text":c.string,"confidence":c.confidence,"x":o.boundingBox.minX,"y":o.boundingBox.minY,"w":o.boundingBox.width,"h":o.boundingBox.height] }
 let data=try JSONSerialization.data(withJSONObject:["file":path,"lines":rows],options:[.prettyPrinted,.sortedKeys]);try data.write(to:out)
 print("\(i+1)/\(paths.count)")
 }catch {print("ERROR \(i): \(error)")}
}

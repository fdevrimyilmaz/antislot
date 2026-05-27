#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SharedConfigModule, NSObject)

RCT_EXTERN_METHOD(saveSmsSettings:(BOOL)enabled
                  strictMode:(BOOL)strictMode
                  customKeywords:(NSArray<NSString *> *)customKeywords
                  autoDeleteDays:(nonnull NSNumber *)autoDeleteDays
                  communityKeywords:(NSArray<NSString *> *)communityKeywords
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(saveBlocklist:(NSArray<NSString *> *)domains
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(savePatterns:(NSArray *)patterns
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(saveWhitelist:(NSArray<NSString *> *)domains
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(saveSafariContentBlockerRules:(NSString *)rulesJson
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getSafariContentBlockerStatus:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(GamblingBlockerModule, NSObject)

RCT_EXTERN_METHOD(startFilter:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopFilter:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isFilterEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(status:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(diagnostics:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(syncBlocklist:(NSString *)apiUrl
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

@interface RCT_EXTERN_MODULE(SharedConfigModule, NSObject)

RCT_EXTERN_METHOD(saveBlocklist:(NSArray *)domains
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(savePatterns:(NSArray *)patterns
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(saveWhitelist:(NSArray *)domains
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(saveBlockerHardening:(BOOL)strictMode
                  blockDoh:(BOOL)blockDoh
                  blockDot:(BOOL)blockDot
                  blockQuic:(BOOL)blockQuic
                  lockdownVpn:(BOOL)lockdownVpn
                  tamperAlerts:(BOOL)tamperAlerts
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(saveSmsSettings:(BOOL)enabled
                  strictMode:(BOOL)strictMode
                  customKeywords:(NSArray *)customKeywords
                  autoDeleteDays:(NSNumber *)autoDeleteDays
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getSmsBlockedCount:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(resetSmsBlockedCount:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cleanupSpamInboxNow:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

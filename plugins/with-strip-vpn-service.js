const { withAndroidManifest } = require("expo/config-plugins");

const VPN_BIND_PERMISSION = "android.permission.BIND_VPN_SERVICE";
const VPN_SERVICE_ACTION = "android.net.VpnService";
const VPN_SERVICE_CLASS = "com.antislot.AntislotVpnService";

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function getName(node) {
  return node?.$?.["android:name"] || "";
}

function removeVpnServicesFromApplication(application) {
  const services = toArray(application.service);
  application.service = services.filter((service) => {
    const serviceName = service?.$?.["android:name"] || "";
    const servicePermission = service?.$?.["android:permission"] || "";
    const intentFilters = toArray(service?.["intent-filter"]);

    const hasVpnIntentAction = intentFilters.some((intentFilter) =>
      toArray(intentFilter?.action).some((action) => getName(action) === VPN_SERVICE_ACTION)
    );

    const shouldRemove =
      serviceName === VPN_SERVICE_CLASS ||
      servicePermission === VPN_BIND_PERMISSION ||
      hasVpnIntentAction;

    return !shouldRemove;
  });
}

function removeVpnPermissions(manifest) {
  const usesPermissions = toArray(manifest["uses-permission"]);
  manifest["uses-permission"] = usesPermissions.filter(
    (permission) => getName(permission) !== VPN_BIND_PERMISSION
  );
}

const withStripVpnService = (config) =>
  withAndroidManifest(config, (config) => {
    const manifest = config.modResults?.manifest;
    if (!manifest) {
      return config;
    }

    removeVpnPermissions(manifest);

    const applications = toArray(manifest.application);
    applications.forEach(removeVpnServicesFromApplication);
    manifest.application = applications;

    return config;
  });

module.exports = withStripVpnService;

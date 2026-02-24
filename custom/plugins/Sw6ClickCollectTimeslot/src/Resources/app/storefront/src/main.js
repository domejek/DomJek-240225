// Import all necessary Storefront plugins
import ExamplePlugin from './example-plugin/example-plugin.plugin';

// Register your plugin via the existing PluginManager
const PluginManager = window.PluginManager;

// Register on both selectors so the component initializes when placed anywhere
PluginManager.register('ExamplePlugin', ExamplePlugin, '[data-click-collect], [data-example-plugin]');
<?php
/**
 * Plugin Name:     Pretty Table of Contents for Elementor
 * Description:     Table of Contents for Elementor, with pretty urls/hashes.
 * Text Domain:     pretty-toc-elementor
 * Version:         1.0.1
 *
 * @package         Elementor_Widget
 */

namespace Pretty_TOC;

define( 'PRETTY_TOC_PLUGIN_URI', plugin_dir_url(  __FILE__  ) );

/**
 * Class Plugin
 *
 * Main Plugin class
 * @since 1.0.0
 */
class Plugin {
 
    /**
     * Instance
     *
     * @since 1.0.0
     * @access private
     * @static
     *
     * @var Plugin The single instance of the class.
     */
    private static $_instance = null;
   
    /**
     * Instance
     *
     * Ensures only one instance of the class is loaded or can be loaded.
     *
     * @since 1.0.0
     * @access public
     *
     * @return Plugin An instance of the class.
     */
    public static function instance() {
        if ( is_null( self::$_instance ) ) {
            self::$_instance = new self();
        }
             
        return self::$_instance;
    }
      
    /**
     * widget_scripts
     *
     * Load required plugin core files.
     *
     * @since 1.2.0
     * @access public
     */
    public function widget_scripts() {
        // wp_register_script( 'yellowwave-mylisting-elementor', plugins_url( '/assets/js/scripts.js', __FILE__ ), [ 'jquery' ], false, true );
    }
   
    /**
     * Register Widgets
     *
     * Register new Elementor widgets.
     *
     */
    public function register_widgets($widgets_manager) {
        // Its is now safe to include Widgets files
        require_once( __DIR__ . '/inc/pretty-toc.php' );
   
        // Register Widgets
        $widgets_manager->register_widget_type( new Widgets\Pretty_TOC() );
    }
  
    /**
     *  Plugin class constructor
     *
     * Register plugin action hooks and filters
     *
     * @since 1.2.0
     * @access public
     */
    public function __construct() {
   
        // Register widget scripts
        // add_action( 'elementor/frontend/after_register_scripts', [ $this, 'widget_scripts' ] );
   
        // Register widgets
        add_action( 'elementor/widgets/widgets_registered', [ $this, 'register_widgets' ] );
    }
}
   
// Instantiate Plugin Class
Plugin::instance();
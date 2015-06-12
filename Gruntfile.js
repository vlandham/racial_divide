/* global grunt, module, require, console */

'use strict';

var watchedFiles = [
  "coffee/*.coffee",
  "js/*.js"
];


module.exports = function (grunt) {
  // load plugins
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-coffee');



  grunt.initConfig({

    coffee: {
      compile: {
        files: {
          'js/racial_divide.js': 'coffee/racial_divide.coffee', // 1:1 compile
        }
      }
    },

    concat: {
      dist: {
        options: {
          separator: '\n',
          nonull: true
        },
        // the files to concatenate
        src: ["js/d3.v3.js", "js/racial_divide.js"],
        // the location of the resulting JS file
        dest: 'js/all.js'
      }
    },

    uglify: {
      files: {
        src: 'js/all.js',
        dest: 'js/',   // destination folder
        expand: true,    // allow dynamic building
        flatten: true,   // remove all unnecessary nesting
        ext: '.min.js'   // replace .js to .min.js
      }
    },

    watch: {
      js:  {
        files: watchedFiles,
        tasks: [ 'concat', 'uglify']
      },
    }

  });

  //
  // Default task - build distribution source
  //
  grunt.registerTask('default', ['coffee', 'concat', 'uglify']);

  //
  // Build documentation
  //
  grunt.registerTask('doc', [ 'jsdoc' ]);

};

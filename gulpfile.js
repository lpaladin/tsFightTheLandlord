var gulp = require("gulp");
var sass = require("gulp-sass");
var autoprefixer = require("gulp-autoprefixer");

exports.default = () =>
    gulp.watch("*.scss", () =>
        gulp
            .src("*.scss")
            .pipe(sass())
            .pipe(
                autoprefixer({
                    browsers: ["last 2 versions"],
                    cascade: false,
                })
            )
            .pipe(gulp.dest("FightTheLandlord2"))
    );

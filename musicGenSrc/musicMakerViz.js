var MakerViz = {};

MakerViz.CIRCLE_RADIUS = 15;

MakerViz.SCORE_WIDTH = window.innerWidth;
MakerViz.SCORE_HEIGHT = window.innerHeight;

/**
 * Constants containing the percentage used by each instrument change box on the
 * score zone.
 */
MakerViz.INST_CHANGE_LABEL_HEIGHT = 10;
MakerViz.INST_CHANGE_HMARGIN_PERCENT = 5;
MakerViz.INST_CHANGE_SELECTED_HEIGHT_PERCENT = 15;
MakerViz.INST_CHANGE_HEIGHT_PERCENT = 10;

MakerViz.PROGRESS_BAR_WMARGIN = 25;
MakerViz.PROGRESS_BAR_HEIGHT = 25;
MakerViz.MARGIN_BETWEEN_BARS = 3;

MakerViz.TITLE_SPACE = 130;
MakerViz.SUBTITLE_HEIGHT = 50;
MakerViz.PROGRESS_BAR_HMARGIN = 25;

MakerViz.LEGEND_WIDTH_PERCENT = 3;

MakerViz.FINISH_MESSAGE_AREA_HEIGHT = 75;

//Constant containing render time.
MakerViz.RENDER_INTERVAL_TIME = 300;

MakerViz.PLAYAREA_HEIGHT = window.innerHeight - LeapManager.INSTRUMENT_LIST.length * (MakerViz.PROGRESS_BAR_HEIGHT + MakerViz.MARGIN_BETWEEN_BARS*2) - MakerViz.TITLE_SPACE - MakerViz.PROGRESS_BAR_HMARGIN*2 - MakerViz.SUBTITLE_HEIGHT;

MakerViz.adjustSVGArea = function() {
    d3.select(".svg-tag").remove();

    var svg = d3.select("#svg-container").append("svg")
        .attr("width", window.innerWidth)
        .attr("height", window.innerHeight - MakerViz.TITLE_SPACE - MakerViz.SUBTITLE_HEIGHT)
        .attr("class", "svg-tag");

    var playableHeight = MakerViz.PLAYAREA_HEIGHT;

    var playAreaContainer = svg.append("g")
        .attr("width", window.innerWidth)
        .attr("height", playableHeight)
        .attr("class", "play-area")
        .attr("transform", "translate(0," + (window.innerHeight - MakerViz.TITLE_SPACE - playableHeight - MakerViz.SUBTITLE_HEIGHT) + ")");

    //this.printSafeZone();

    this.printLines(LeapManager.NUMBER_OF_TONES, window.innerWidth, playableHeight);
    this.printLegend(LeapManager.NUMBER_OF_TONES, playableHeight);

    var buttonAreas = playAreaContainer.append("g").attr("class", "button-areas");

    playAreaContainer.append("g").attr("class", "circle-container");
    playAreaContainer.append("g").attr("class", "tail-container");

    this.printFinishButton(buttonAreas);
    this.printInstChangeZone(buttonAreas);
    this.printInstChangeAreas(buttonAreas);

    var insBarContainer = this.printRecordedInstruments();
    this.printPattern(insBarContainer);

    this.drawIndications();
}

MakerViz.printFinishMessage = function(playAreaContainer) {
    var radius = MakerViz.PLAYAREA_HEIGHT * MakerViz.INST_CHANGE_SELECTED_HEIGHT_PERCENT/(2*100);
    var margin = (LeapManager.NO_TONE_MARGIN_PERCENT*window.innerWidth/100 - radius*2)/2;
    var rightMarginStartingWidth = window.innerWidth - LeapManager.NO_TONE_MARGIN_PERCENT*window.innerWidth/100
    var finishMessageGroup = playAreaContainer.append("g").classed("finish-message", true);
    var width = LeapManager.NO_TONE_MARGIN_PERCENT*window.innerWidth/100 - margin;
    finishMessageGroup.append("rect")
        .attr("class", "finish-message-area")
        .attr("x", margin/2 + rightMarginStartingWidth)
        .attr("y", MakerViz.PLAYAREA_HEIGHT - margin*0.5 - radius*2 - this.FINISH_MESSAGE_AREA_HEIGHT)
        .attr("rx", "10")
        .attr("ry", "10")
        .attr("width", width)
        .attr("height", this.FINISH_MESSAGE_AREA_HEIGHT);

    finishMessageGroup.append("text")
        .attr("class", "finish-message-text")
        .attr("x", margin/2 + rightMarginStartingWidth + width/2)
        .attr("y", MakerViz.PLAYAREA_HEIGHT - margin*0.5 - radius*2 - this.FINISH_MESSAGE_AREA_HEIGHT*3/4)
        .attr("width", LeapManager.NO_TONE_MARGIN_PERCENT*window.innerWidth/100 - margin)
        .attr("height", this.FINISH_MESSAGE_AREA_HEIGHT)
        .append("tspan")
            .attr("x", margin/2 + rightMarginStartingWidth + width/2)
            .attr("dy", 0)
            .text("Go and play")
        .append("tspan")
            .attr("x", margin/2 + rightMarginStartingWidth + width/2)
            .attr("dy", 20)
            .text("more tones")
        .append("tspan")
            .attr("x", margin/2 + rightMarginStartingWidth + width/2)
            .attr("dy", 20)
            .text("before finishing!");
};

MakerViz.printFinishButton = function(playAreaContainer) {
    var radius = MakerViz.PLAYAREA_HEIGHT * MakerViz.INST_CHANGE_SELECTED_HEIGHT_PERCENT/(2*100);
    var margin = (LeapManager.NO_TONE_MARGIN_PERCENT*window.innerWidth/100 - radius*2)/2;
    var radius = MakerViz.PLAYAREA_HEIGHT * MakerViz.INST_CHANGE_SELECTED_HEIGHT_PERCENT/(2*100);
    var rightMarginStartingWidth = window.innerWidth - LeapManager.NO_TONE_MARGIN_PERCENT*window.innerWidth/100
    if(playAreaContainer.select(".finish-button").size() === 0) {
        playAreaContainer.append("circle")
            .attr("class", "finish-button")
            .attr("cx", margin + radius + rightMarginStartingWidth)
            .attr("cy", MakerViz.PLAYAREA_HEIGHT - margin - radius)
            .attr("r", radius);
        playAreaContainer.append("text")
            .attr("class", "finish-label")
            .attr("x", margin + radius + rightMarginStartingWidth)
            .attr("y", MakerViz.PLAYAREA_HEIGHT - margin - radius)
            .text("Finish!");

        MakerViz.printFinishMessage(playAreaContainer);
    }

    if(HandPlayer.isFinishLocked())
        playAreaContainer.select(".finish-button").classed("locked-button", true);
    else playAreaContainer.select(".finish-button").classed("locked-button", false);
};

MakerViz.printInstChangeZone = function(playAreaContainer) {
    var label = MakerViz.PLAYAREA_HEIGHT * MakerViz.INST_CHANGE_LABEL_HEIGHT / 100
    var halfMargin = MakerViz.PLAYAREA_HEIGHT * MakerViz.INST_CHANGE_HMARGIN_PERCENT / (2*100);
    var areaHeight = LeapManager.INSTRUMENT_LIST.length*MakerViz.PLAYAREA_HEIGHT*((MakerViz.INST_CHANGE_HMARGIN_PERCENT/2)+MakerViz.INST_CHANGE_SELECTED_HEIGHT_PERCENT)/100;
    var areaWidth = MakerViz.PLAYAREA_HEIGHT*(MakerViz.INST_CHANGE_SELECTED_HEIGHT_PERCENT+MakerViz.INST_CHANGE_HMARGIN_PERCENT) / 100;
    playAreaContainer.append("rect")
        .attr("class", "change-inst-zonerect")
        .attr("x", halfMargin)
        .attr("y", halfMargin)
        .attr("width", areaWidth)
        .attr("height", areaHeight+label+halfMargin);

    playAreaContainer.append("text")
        .attr("class", "pick-label")
        .attr("x", areaWidth/2+halfMargin)
        .attr("y", halfMargin*3)
        .append("tspan")
            .attr("x", areaWidth/2+halfMargin)
            .attr("dy", 0)
            .text("Pick an")
        .append("tspan")
            .attr("x", areaWidth/2+halfMargin)
            .attr("dy", 20)
            .text("instrument!");
}

MakerViz.printInstChangeAreas = function(playAreaContainer) {
    var rectX;
    for(var i = 0; i < LeapManager.INSTRUMENT_LIST.length; ++i) {
        rectX = i*MakerViz.PLAYAREA_HEIGHT*((MakerViz.INST_CHANGE_HMARGIN_PERCENT/2)+MakerViz.INST_CHANGE_SELECTED_HEIGHT_PERCENT)/100;
        
        var sidePercent = MakerViz.INST_CHANGE_SELECTED_HEIGHT_PERCENT;
        var halfSizeDiff = 0;
        if(LeapManager.currentHandInstrument != i) {
            halfSizeDiff = (MakerViz.INST_CHANGE_SELECTED_HEIGHT_PERCENT - MakerViz.INST_CHANGE_HEIGHT_PERCENT)/2;
            sidePercent = MakerViz.INST_CHANGE_HEIGHT_PERCENT;
        }

        if(playAreaContainer.select(".inst-rect" + i).size() !== 0) {
            playAreaContainer.select(".inst-rect" + i)
                .transition()
                    .duration(150)
                    .attr("x", MakerViz.PLAYAREA_HEIGHT * (MakerViz.INST_CHANGE_HMARGIN_PERCENT+halfSizeDiff) / 100)
                    .attr("y", rectX + MakerViz.PLAYAREA_HEIGHT * (MakerViz.INST_CHANGE_HMARGIN_PERCENT+MakerViz.INST_CHANGE_LABEL_HEIGHT+halfSizeDiff) / 100)
                    .attr("width", MakerViz.PLAYAREA_HEIGHT*sidePercent / 100)
                    .attr("height", MakerViz.PLAYAREA_HEIGHT*sidePercent / 100)

        }
        else playAreaContainer.append("rect")
            .attr("class", "change-inst-rect inst-rect" + i)
            .attr("x", MakerViz.PLAYAREA_HEIGHT * (MakerViz.INST_CHANGE_HMARGIN_PERCENT+halfSizeDiff) / 100)
            .attr("y", rectX + MakerViz.PLAYAREA_HEIGHT * (MakerViz.INST_CHANGE_HMARGIN_PERCENT+MakerViz.INST_CHANGE_LABEL_HEIGHT+halfSizeDiff) / 100)
            .attr("width", MakerViz.PLAYAREA_HEIGHT*sidePercent / 100)
            .attr("height", MakerViz.PLAYAREA_HEIGHT*sidePercent / 100)
            .style("fill", LeapManager.INSTRUMENT_LIST[i].color);
    }
}

/*MakerViz.redrawVoronoi = function() {
    this.voronoiPaths = this.voronoiPaths
        .data(this.voronoi(this.vertices), polygon);

    this.voronoiPaths.exit().transition().attr("fill","blue");

    this.voronoiPaths.enter().append("path")
        .attr("d", polygon);

    this.voronoiPaths.order();

    function polygon(d) {
      return "M" + d.join("L") + "Z";
    }
}

MakerViz.voronoiPaths = undefined;

MakerViz.vertices = undefined;
MakerViz.voronoi = undefined;*/

/*MakerViz.printVoronoi = function() {
    this.vertices = d3.range(2000).map(function(d) {
        return [Math.random() * MakerViz.SCORE_WIDTH, Math.random() * MakerViz.SCORE_HEIGHT];
    });

    var voronoiContainer = d3.select(".svg-tag").append("g")
        .attr("class", "voronoi-area")
        .attr("height", this.SCORE_HEIGHT)
        .attr("width", this.SCORE_WIDTH)
        .on("mousemove", function() { 
            MakerViz.vertices[0] = d3.mouse(this); 
            MakerViz.redrawVoronoi(); }
        );

    this.voronoiPaths = voronoiContainer.selectAll("path");

    this.voronoi = d3.geom.voronoi()
        .clipExtent([[0, 0], [this.SCORE_WIDTH, this.SCORE_HEIGHT]]);

    this.redrawVoronoi();
}*/


MakerViz.printRecordedInstLimits = function(container) {
    //Only if there is not already a rect.
    if(container.select(".recorded-ins-rect").size() === 0)
        container.append("rect")
            .attr("class", "recorded-ins-rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", window.innerWidth - MakerViz.PROGRESS_BAR_WMARGIN*2)
            .attr("height", MakerViz.PROGRESS_BAR_HEIGHT + MakerViz.MARGIN_BETWEEN_BARS*2);
}


/**
 * Given an instrument index returns true if this is the current instrument being
 * used by the user. False otherwise.
 */
MakerViz.isCurrentColor = function(instrumentIndex) {
    return instrumentIndex === LeapManager.currentHandInstrument;
};


/**
 * Print current pattern, with recorded tones for each instrument.
 */
MakerViz.printRecordedInstruments = function() {
    var pattern = HandPlayer.activePatterns[0].pattern;

    d3.selectAll(".pattern-bar-group > g.instrument-bar-group").remove();
    var barGroup = d3.select(".pattern-bar-group");

    if(barGroup.size() === 0) {
        var barGroup = d3.select(".svg-tag").append("g")
            .attr("class", "pattern-bar-group")
            .attr("width", window.innerWidth - MakerViz.PROGRESS_BAR_WMARGIN*2)
            .attr("height", pattern.length * (MakerViz.PROGRESS_BAR_HEIGHT + MakerViz.MARGIN_BETWEEN_BARS));
    }

    var x = d3.scale.linear()
        .range([0, window.innerWidth - MakerViz.PROGRESS_BAR_WMARGIN*2]);

    var y = d3.scale.linear()
        .range([MakerViz.PROGRESS_BAR_HEIGHT/2, 0]);

    var line = d3.svg.line()
        .x(function(d, i) { 
            return x(i); 
        })
        .y(function(d, i) { 
            return y(Math.max(d.tones[0], 0)); 
        });

    var area = d3.svg.area()
        .x(function(d, i) {
            return x(i);
        })
        .y0(MakerViz.PROGRESS_BAR_HEIGHT/2)
        .y1(function(d, i) {
            return y(Math.max(d.tones[0], 0));
        });

    //Inverse variables:
    var yInverse = d3.scale.linear()
        .range([MakerViz.PROGRESS_BAR_HEIGHT/2, MakerViz.PROGRESS_BAR_HEIGHT]);

    var lineInverse = d3.svg.line()
        .x(function(d, i) { 
            return x(i); 
        })
        .y(function(d, i) { 
            return yInverse(Math.max(d.tones[0], 0)); 
        });

    var areaInverse = d3.svg.area()
        .x(function(d, i) {
            return x(i);
        })
        .y0(MakerViz.PROGRESS_BAR_HEIGHT/2)
        .y1(function(d, i) {
            return yInverse(Math.max(d.tones[0], 0));
        });

    x.domain([0, HandPlayer.NUM_TONES_PATTERN-1]);
    y.domain([0, LeapManager.NUMBER_OF_TONES]);

    yInverse.domain([0, LeapManager.NUMBER_OF_TONES]);

    var top = MakerViz.PROGRESS_BAR_HMARGIN;

    for(var inst = 0; inst < pattern.length; ++inst) {
        var color = LeapManager.INSTRUMENT_LIST[inst].color;
        var gContainer = d3.select(".inst-bar-g-" + inst);
        var lContainer = d3.select(".inst-bar-line-g-" + inst);
        if(gContainer.size() === 0) {
            gContainer = barGroup.append("g")
                .attr("class", "inst-bar-g-" + inst)
                .attr("transform", "translate(" + MakerViz.PROGRESS_BAR_WMARGIN + "," + top + ")");
            this.printRecordedInstLimits(gContainer);

            lContainer = gContainer.append("g")
                .attr("class", "inst-bar-line-g-" + inst)
                .attr("transform", "translate(0," + MakerViz.MARGIN_BETWEEN_BARS + ")");

            lContainer.append("path")
                .attr("class", "line")
                .style("stroke", color);
            lContainer.append("path")
                .attr("class", "area")
                .style("fill", color)
                .style("stroke", color);

            lContainer.append("path")
                .attr("class", "line inverse-line")
                .style("stroke", color);
            lContainer.append("path")
                .attr("class", "area inverse-area")
                .style("fill", color)
                .style("stroke", color);
        }

        var scaledPatterns = _.map(pattern[inst] || [], function(item) {
            return {tones: [item.tones[0]*LeapManager.NUMBER_OF_TONES/LeapManager.INSTRUMENT_LIST[inst].numTones]};
        });

        lContainer.select(".line")
            .classed("opaque-pattern", this.isCurrentColor(inst) ? false : true)
            .datum(scaledPatterns)
              .transition(150)
                .attr("d", line)
                .style("stroke", color);
        lContainer.select(".area")
            .classed("opaque-pattern", this.isCurrentColor(inst) ? false : true)
            .datum(scaledPatterns)
              .transition(150)
                .attr("d", area)
                .style("fill", color);

        lContainer.select(".inverse-line")
            .classed("opaque-pattern", this.isCurrentColor(inst) ? false : true)
            .datum(scaledPatterns)
              .transition(150)
                .attr("d", lineInverse)
                .style("stroke", color);
        lContainer.select(".inverse-area")
            .classed("opaque-pattern", this.isCurrentColor(inst) ? false : true)
            .datum(scaledPatterns)
              .transition(150)
                .attr("d", areaInverse)
                .style("fill", color);

        //Ensure that it does not contain the class reserver for the current instrument rectangle.
        gContainer.select("rect").classed("current-ints-rect", false);
        //If this is the current selected instrument add the appropriate class to its rect.
        if(this.isCurrentColor(inst)) gContainer.select("rect").classed("current-ints-rect", true);

        top += MakerViz.PROGRESS_BAR_HEIGHT + MakerViz.MARGIN_BETWEEN_BARS*2;
    }

    return barGroup;
}


/**
 * Print the bar which informs in what state of pattern recording we are.
 * We could be in the middle of a pattern record or in the finished state when
 * we can decide to add this pattern.
 */
MakerViz.printPattern = function(instrumentBarContainer) {
    d3.select(".pattern-bar-completed").remove();
    d3.select(".pattern-bar-uncompleted").remove();

    var percentage = HandPlayer.activePatterns[0] ? (HandPlayer.activePatterns[0].index*100/HandPlayer.NUM_TONES_PATTERN) : 0;

    var coef = percentage/100;

    var currentSecond = Math.floor(HandPlayer.activePatterns[0].index*HandPlayer.INTERVAL_TIME/1000);
    if(currentSecond <= 9) currentSecond = "0" + currentSecond;
    currentSecond = "00:" + currentSecond;

    var barGroup = d3.select(".tempo-line-group");
    if(barGroup.size() !== 0) {
        barGroup.select(".shader-rect")
            .transition(1000/HandPlayer.RENDERS_PER_SECOND)
            .ease("linear")
                .attr("x", coef * (window.innerWidth - MakerViz.PROGRESS_BAR_WMARGIN*2))
                .attr("width", (1-coef) * (window.innerWidth - MakerViz.PROGRESS_BAR_WMARGIN*2))
                .attr("height", HandPlayer.activePatterns[0].pattern.length * (MakerViz.PROGRESS_BAR_HEIGHT + MakerViz.MARGIN_BETWEEN_BARS*2));
        barGroup.select(".tempo-line")
            .transition(1000/HandPlayer.RENDERS_PER_SECOND)
            .ease("linear")
                .attr("x1", coef * (window.innerWidth - MakerViz.PROGRESS_BAR_WMARGIN*2))
                .attr("x2", coef * (window.innerWidth - MakerViz.PROGRESS_BAR_WMARGIN*2));
        
        barGroup.select(".counter")
            .transition(1000/HandPlayer.RENDERS_PER_SECOND)
            .ease("linear")
                .attr("x", coef * (window.innerWidth - MakerViz.PROGRESS_BAR_WMARGIN*2))
                .text(currentSecond);
    }
    else {
        barGroup = instrumentBarContainer.append("g")
            .attr("class", "tempo-line-group")
            .attr("transform", "translate(" + MakerViz.PROGRESS_BAR_WMARGIN + "," + MakerViz.PROGRESS_BAR_HMARGIN + ")");

        barGroup.append("rect")
            .attr("class", "shader-rect")
            .attr("x", coef * (window.innerWidth - MakerViz.PROGRESS_BAR_WMARGIN*2))
            .attr("y", 0)
            .attr("width", (1-coef) * (window.innerWidth - MakerViz.PROGRESS_BAR_WMARGIN*2))
            .attr("height", HandPlayer.activePatterns[0].pattern.length * (MakerViz.PROGRESS_BAR_HEIGHT + MakerViz.MARGIN_BETWEEN_BARS*2));

        barGroup.append("svg:line")
            .attr("x1", coef * (window.innerWidth - MakerViz.PROGRESS_BAR_WMARGIN*2))
            .attr("y1", 0)
            .attr("x2", coef * (window.innerWidth - MakerViz.PROGRESS_BAR_WMARGIN*2))
            .attr("y2", HandPlayer.activePatterns[0].pattern.length * (MakerViz.PROGRESS_BAR_HEIGHT + MakerViz.MARGIN_BETWEEN_BARS*2))
            .attr("class","tempo-line");

        barGroup.append("text")
            .attr("class", "counter")
            .attr("x", coef * (window.innerWidth - MakerViz.PROGRESS_BAR_WMARGIN*2))
            .attr("y", -5)
            .text(currentSecond);
    }

    var barMargin = 25;
    var height = 40;
    var weightPerc = 10;
    var width = window.innerWidth * weightPerc/100;
    d3.select(".svg-tag").append("rect")
        .attr("class", "pattern-bar-completed")
        .attr("x", barMargin)
        .attr("y", window.innerHeight-barMargin-height)
        .attr("width", width*coef + "px")
        .attr("height", height + "px")
        .style("fill", HandPlayer.patternRecordingEnabled ? "black" : "red");

    d3.select(".svg-tag").append("rect")
        .attr("class", "pattern-bar-uncompleted")
        .attr("x", (barMargin + width*coef) + "px")
        .attr("y", window.innerHeight-barMargin-height)
        .attr("width", width*(100-percentage)/100 + "px")
        .attr("height", height + "px")
        .style("fill", "white");
}


MakerViz.printLegend = function(numLines, totalHeight) {
    var safeZoneWidth = LeapManager.NO_TONE_MARGIN_PERCENT*window.innerWidth/100;
    var legendWidth = MakerViz.LEGEND_WIDTH_PERCENT*window.innerWidth/100;

    var legendContainer = d3.select(".play-area").append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + safeZoneWidth + ", 0)");

    //Create gradient.
    var gradient = legendContainer.append("defs")
      .append("linearGradient")
        .attr("id", "legendGradient")
        .attr("x1", "100%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%")
        .attr("spreadMethod", "pad");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#f7f7ed")
        .attr("stop-opacity", 1);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#b58f82")
        .attr("stop-opacity", 1);

    var lineHeight = totalHeight/numLines;

    legendContainer.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", legendWidth)
            .attr("height", totalHeight-lineHeight)
            .attr("class", "score-rect")
            .style("fill", "url(#legendGradient)");

    legendContainer.append("text")
        .attr("class", "legend-text legend-low")
        .attr("x", legendWidth/2)
        .attr("y", totalHeight-lineHeight - 15)
        .text("Bass");

    legendContainer.append("text")
        .attr("class", "legend-text legend-high")
        .attr("x", legendWidth/2)
        .attr("y", 15)
        .text("Treble");

    legendContainer.append("svg:image")
        .attr("xlink:href", ResHelper.getResPath() + "/imgs/clef.png")
        .attr("x", legendWidth/4)
        .attr("y", (totalHeight-lineHeight)/2-legendWidth/2)
        .attr("height", "100%")
        .attr("width", legendWidth/2)
        //.attr("viewBox", 0 + " " + (totalHeight-lineHeight)/2 + " " + legendWidth + " 0")
        .attr("preserveAspectRatio", "xMaxYMin meet")
        .attr("class", "clef-icon");
};

/**
 * Print numLines horizontal lines simulating a pentagram. Those lines are 
 * equally separated.
 * totalHeight is the total height of all lines.
 * width is the width of the screen.
 */
MakerViz.printLines = function(numLines, width, totalHeight) {
    var safeZoneWidth = LeapManager.NO_TONE_MARGIN_PERCENT*window.innerWidth/100;
    var legendWidth = MakerViz.LEGEND_WIDTH_PERCENT*window.innerWidth/100;
    var linesContainer = 
        d3.select(".play-area").append("g")
            .attr("class", "lines-container")
             .attr("transform", "translate(" + (safeZoneWidth + legendWidth) + ", 0)");
    var lineHeight = totalHeight/numLines;

    linesContainer.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width - safeZoneWidth*2 - legendWidth)
            .attr("height", lineHeight*(numLines-1))
            .attr("class", "score-rect");

    for(var i = 0; i < numLines; ++i)
        linesContainer.append("svg:line")
            .attr("x1", 0)
            .attr("y1", lineHeight*i)
            .attr("x2", width - safeZoneWidth*2 - legendWidth)
            .attr("y2", lineHeight*i)
            .attr("class", i % 5 === 0 ? "bold-horizontal-line" : "horizontal-line");
}


/**
 * Variable containing the id of the timeout set to delete the user pointer
 * when we don't know anything about its hands during a period of time.
 * @type {[type]}
 */
MakerViz.currentHandTimeoutId = undefined;


/**
 * Variable containing the id of the timeout set to show the main info
 * when we don't know anything about the user a period of time.
 * @type {[type]}
 */
MakerViz.mainInfoTimeoutId = undefined;


/**
 * Function in charge of cleaning user pointer.
 */
MakerViz.clearUserPointer = function() {
    var circle = d3.select("circle.hand-mark");
    if(circle.size() === 1) circle.transition()
            .duration(1000)
            .attr("r", "0px");
    ParticleManager.clearUserInformation();
};

MakerViz.updateHandOnScreen = function(handFrame, handState) {

    if(this.mainInfoTimeoutId) clearTimeout(this.mainInfoTimeoutId);
    if(this.currentHandTimeoutId) clearTimeout(this.currentHandTimeoutId);

    var positionPercentage = MusicGenGlobal.getPositionPercentage(handFrame);

    var left = positionPercentage.left;
    var top = positionPercentage.top;
    var circleClass = "hand-mark ";

    if(MusicGenGlobal.isPlaying(handFrame)) {
        //Hide info If the user is playing (in case the info is visible).
        d3.select(".main-info").style("opacity", 0);
        circleClass += "grabbing ";

        ParticleManager.updateUserInformation(left*window.innerWidth/100, top*this.PLAYAREA_HEIGHT/100, ParticleManager.PLAYING, handState.instrumentIndex);
    }
    else {
        circleClass += "no-grabbing ";
        ParticleManager.updateUserInformation(left*window.innerWidth/100, top*this.PLAYAREA_HEIGHT/100, ParticleManager.STOPPED, handState.instrumentIndex);
    }

    if(!MusicGenGlobal.isOnPlayingZone(handFrame)) {
        circleClass += "on-safe-zone ";
        ParticleManager.updateUserInformation(left*window.innerWidth/100, top*this.PLAYAREA_HEIGHT/100, ParticleManager.ON_SAFE_ZONE, handState.instrumentIndex);
    }

    d3.selectAll("circle.hand-mark").remove();
    var circle = d3.select(".circle-container").append("circle")
        .attr("cx", left*window.innerWidth/100 + "px")
        .attr("cy", top*this.PLAYAREA_HEIGHT/100 + "px")
        .attr("r", this.CIRCLE_RADIUS)
        .attr("class", circleClass + " id-" + handFrame.id)
        .style("fill", LeapManager.INSTRUMENT_LIST[handState.instrumentIndex].color);
    

    if(MusicGenGlobal.LEAP_ENABLED)
        this.currentHandTimeoutId = 
            setTimeout(function() { MakerViz.clearUserPointer(); }, 200);

    this.mainInfoTimeoutId = 
            setTimeout(function() { MakerViz.showMainInfo(); }, 5000);
};


MakerViz.render = function() {
    this.printFinishButton(d3.select(".button-areas"));
    var insBarContainer = this.printRecordedInstruments();
    this.printPattern(insBarContainer);
};

/**
 * Callback called each time that there is an instrument change.
 * @return {[type]} [description]
 */
MakerViz.applyInstChangeVisuals = function() {
    this.printInstChangeAreas(d3.select(".play-area"));
};


MakerViz.drawIndications = function() {
    var infoGroup = d3.select(".svg-tag").append("g")
        .attr("class", "main-info")
        .attr("transform", "translate("+ window.innerWidth/3 +"," + window.innerHeight/3 + ")");
    
    infoGroup.append("image")
        .attr("href", ResHelper.getResPath() + "/imgs/click.png")
        .attr("class", "main-info-img")
        .attr("width", window.innerWidth/8)
        .attr("height", window.innerWidth/8)
        .attr("x", 0)
        .attr("y", 0)
        .attr("preserveAspectRatio");

    infoGroup.append("text")
        .attr("class", "main-info-text")
        .append("tspan")
            .attr("x", window.innerWidth/8)
            .attr("y", 0)
            .attr("dy", 30)
            .text("Click to")
        .append("tspan")
            .attr("x", window.innerWidth/8)
            .attr("y", 0)
            .attr("dy", 60)
            .text("compose");
};



MakerViz.showFinishWarning = function() {
    d3.selectAll(".finish-message").transition().style("opacity", 1);

    setTimeout(function() {
        d3.selectAll(".finish-message").transition().style("opacity", 0);
    }, 3000)
}

/**
 * Change opacity of main info to 1, making it visible.
 * @return {[type]} [description]
 */
MakerViz.showMainInfo = function() {
    d3.select(".main-info")
        .transition()
            .duration(2000)
            .style("opacity", 1);
}
$(function() {
    var graph;
    var selectedBarButton;

    function createGraph(data){
        var s1, ticks, colors;
        if(data.passed === 0){
            s1 = [data.a, data.b, data.c, data.d, data.e, data.f]
            ticks = ['A', 'B', 'C', 'D', 'E', 'F'];
            colors = [ "#00CC00", "#00CC33", "#CCFF33", "#FFFF00", "#FF6600", "#CC0000"];
            barMargin = 2;
            max = null;
        }
        else{
            s1 = [data.passed, data.f]
            ticks = ['Bestått', 'Ikke bestått']
            colors = [ "#00CC00", "#CC0000"];
            barMargin = 10;
            max = ((data.passed == data.f) ? data.passed +1 : null);
        }
        graph = $.jqplot('grades-graph', [s1],
        {
            seriesColors: colors,

            seriesDefaults:
            {
                renderer:$.jqplot.BarRenderer,
                pointLabels: { show: true, formatString: '%d', formatter: $.jqplot.DefaultTickFormatter},
                rendererOptions: { barMargin: barMargin, varyBarColor: true}
            },
            axes:
            {
                xaxis:
                {
                    renderer: $.jqplot.CategoryAxisRenderer,
                    ticks: ticks,
                    tickOptions: { showGridLine: false }
                },
                yaxis:
                {
                    max: max,
                    tickOptions: { show: false}
                }
            },
            grid:{ gridLineColor: '#FFF'}
        });
    }

    function createButtons(json){
        if($("#grade-buttons").innerWidth() < 320){
            var breakPoint = 3;
        }
        else{
            var breakPoint = 4;
        }

        var buttonGroup = document.createElement('div');

        $(buttonGroup).addClass("btn-group");

        for(var i = 0; i < json.length; i++){
            if(i % breakPoint == 0 && i != 0){
                $("#grade-buttons").append(buttonGroup);
                buttonGroup = document.createElement('div');
                $(buttonGroup).addClass("btn-group");
            }
            $(buttonGroup).append("<button type=\"button\" id=\"" + i + "\" class=\"btn-grade btn btn-default\">" + json[i].semester_code + "</button>");
        }
        
        $("#grade-buttons").append(buttonGroup);
        $("#average-grade").text(json[0].average_grade.toFixed(2));
        $(".btn-grade").last().addClass("active");
        selectedBarButton = json.length -1;
        
        $(".btn-grade").bind('click', function(event){
            var data, s1;
            $(".btn-grade").removeClass("active");
            $(event.target).addClass("active");
            data = json[event.target.id];
            selectedBarButton = event.target.id;

            $("#average-grade").text(data.average_grade.toFixed(2));

            graph.destroy();
            createGraph(data);
        });

    }

    function createLineGraph(ticks, values, format){
        graph = $.jqplot('grades-graph', [values],
        {
            seriesDefaults:
            {
                pointLabels: { show: true, formatString: format, formatter: $.jqplot.DefaultTickFormatter}
            },
            axes:
            {
                xaxis:
                {
                    renderer: $.jqplot.CategoryAxisRenderer,
                    ticks: ticks,
                    tickOptions: { showGridLine: false }
                },
                yaxis:
                {
                    tickOptions: { show: false}
                }
            },
            grid:{ gridLineColor: '#FFF'}
        });
    }

    function getLineGraphTicks(json){
        var ticks = [];

        for(var i = 0; i < json.length; i++){

            //reduce the semester code length if the ammount of semesters is to big
            if(json.length > 8){
                var string = json[i].semester_code;
                ticks.push(string.substring(0, 1) + string.substring(3, 5));
            }
            else{
                ticks.push(json[i].semester_code);
            }
        }

        return ticks;
    }

    function getAverageValues(json){
        var values = [];

        for(var i = 0; i < json.length; i++){
            values.push(json[i].average_grade);
        }

        return values;
    }

    function getFailrates(json){
        var values = [];

        for(var i = 0; i < json.length; i++){
            if(json[i].passed === 0){
                var total = json[i].a + json[i].b + json[i].c + json[i].d + json[i].e + json[i].f;
            }
            else{
                var total = json[i].passed + json[i].f;
            }

            var failure = (json[i].f / total) * 100;
            values.push(failure);
        }
        return values;
    }



    function setupGraphSelector(json){
        if(json[0].passed != 0){
            $("#average-graph-button").addClass("hide");
        }

        $("#bar-graph-button").bind("click", function(){
            $("#graph-selector > div > button.active").removeClass("active");
            $("#bar-graph-button").addClass("active");
            $("#bar-chart-data").removeClass("hide");
            graph.destroy();
            createGraph(json[selectedBarButton]);
        }).addClass("active");


        $("#average-graph-button").bind("click", function(){
            $("#graph-selector > div > button.active").removeClass("active");
            $("#average-graph-button").addClass("active");
            $("#bar-chart-data").addClass("hide");

            var ticks = getLineGraphTicks(json);
            var values = getAverageValues(json);
            
            graph.destroy();
            createLineGraph(ticks, values, '%.2f');
        });
        
        $("#failed-graph-button").bind("click", function(){
            $("#graph-selector > div > button.active").removeClass("active");
            $("#failed-graph-button").addClass("active");
            $("#bar-chart-data").addClass("hide");

            var ticks = getLineGraphTicks(json);
            var values = getFailrates(json);
            
            graph.destroy();
            createLineGraph(ticks, values, '%d%');
        });
    }

    $.ajax({
		type: 'GET',
		url: "grades/",
		async: false,
		jsonpCallback: 'parse',
		contentType: "application/json",
		dataType: 'jsonp',
		success: function(json) {
			$.jqplot.config.enablePlugins = true;
			setupGraphSelector(json);
			createButtons(json);
			createGraph(json[json.length - 1])
		},
		error: function(e) {
			console.log(e.message);
		}
	});

	$(window).resize(function() {
        $.each(graph.series, function(index, series) {
            series.barWidth = undefined;
        });
        graph.replot({resetAxes: true});
    });

});


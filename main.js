var _htmlPdf = require('html-pdf'),
    _fs = require('fs'),
    _handlebars = require('handlebars'),
    _http = require('http'),
    _moment = require('moment');

function init() {
    _handlebars.registerPartial('future-planner', _fs.readFileSync('./future_planner.html', 'utf8'));
    _handlebars.registerPartial('monthly-planner', _fs.readFileSync('./monthly_planner.html', 'utf8'));
    _handlebars.registerPartial('weekly-planner', _fs.readFileSync('./weekly_planner.html', 'utf8'));


    _handlebars.registerHelper('calendar', function(month) {
        var timestamp = _moment({
            year: this.year,
            month: _moment().month(month).format("M") - 1
        });
        var out = "<table class=\"calendar\"><tr><td>S</td><td>M</td><td>Tu</td><td>W</td><td>Th</td><td>F</td><td>S</td></tr>";
        var printedDate = 0;

        for (var row = 0; row < getWeekNums(timestamp); row++) {
            out += "<tr>";
            for (var col = 0; col < 7; col++) {
                out += "<td>";
                if (printedDate > 0 && printedDate < timestamp.daysInMonth()) {
                    out += ++printedDate;
                }
                else if (timestamp.day() === col) {
                    out += ++printedDate;
                }
                out += "</td>";
            }
            out += "</tr>";
        }
        return out + "</table>";
    });

    _handlebars.registerHelper('each-NPairs', function(items, options) {
        if (!options.hash.N) {
            throw "Argument N required to each-NPairs helper.";
        }

        var N = parseInt(options.hash.N),
            out = "";
        if (!N) {
            throw "Argument N must be an int";
        }

        for (var i = 0; i < items.length; i += N) {
            var context = {};
            for (var j = 0; j < N; j++) {
                context["item"+j] = items[i+j];
            }
            out += options.fn(context);
        }
        return out;
    });

    _handlebars.registerHelper('each-with-parent', function(items, options) {
        var out = "";
        items.forEach(function(item) {
            out += options.fn(this, {data: {it: item}});
        });
        return out;
    });


    _handlebars.registerHelper('assign', function(name, value) {
        if (!name || !value) {
            throw "Name and value required";
        }
        this[name] = value;
    });

    _handlebars.registerHelper('each-day-in-month', function(options) {
        var out = "";
        var daysInMonth = _moment({
            year: this.year,
            month: _moment().month(this.month).format("M") - 1
        }).daysInMonth();
        for (var i = 1; i <= daysInMonth; i++) {
            out += options.fn(this, {data: {day: i}});
        }
        return out;
    });

    _handlebars.registerHelper('each-week-in-month', function(options) {
        var out = "";
        var timestamp = _moment({
            year: this.year,
            month: _moment().month(this.month).format("M") - 1
        }),
            start = timestamp.startOf('month'),
            end = _moment(timestamp).endOf('month');
        while (start.isBefore(end)) {
            // Week 1 should be in January, making up week for last week in year
            var week = start.week() == 1 && start.month() == 11 ?  start.week() + 52 : start.week();
            out += options.fn(this, {data: {week: week}});
            start.add(1, 'week');

            if (start.startOf('week').date() >= 29 && start.month() != 11) {
                break;
            }
        }
        return out;
    });

    _handlebars.registerHelper('each-day-date-in-week', function(options) {
        var out = "";
        var momentStart = _moment(this.year).add(this.week - 1, 'weeks'),
            momentEnd = _moment(this.year).add(this.week, 'weeks');

        while (momentStart.isBefore(momentEnd)) {
            momentStart.add(1, 'days');
            out += options.fn(this, {data: {dayDate: momentStart.format('Dddd')}});
        }
        return out;
    });

    _handlebars.registerHelper('days-in-month', function() {
        return _moment({
            year: this.year,
            month: _moment().month(this.month).format("M") - 1
        }).daysInMonth();
    });

    return _handlebars.compile(_fs.readFileSync('./index.html', 'utf8'));
}

if (process.argv.length === 3 && process.argv[3] === 'print') {

}
else {
    _http.createServer(function(req, resp) {
        var template = init();

        resp.writeHead(200, {'Content-Type': 'text/html'});
        resp.write(template({
            year: "2018",
            months: _moment.months()
        }));
        resp.end();
    }).listen(8080);
}

function getWeekNums(momentObj) {
    var clonedMoment = _moment(momentObj), first, last;

    // get week number for first day of month
    first = clonedMoment.startOf('month').week();
    // get week number for last day of month
    last = clonedMoment.endOf('month').week();

    // In case last week is in next year
    if( first > last) {
        last = first + last;
    }
    return last - first + 1;
}

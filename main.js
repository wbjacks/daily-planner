var _htmlPdf = require('phantom-html-to-pdf')({
        phantomPath: require("phantomjs-prebuilt").path
    }),
    _fs = require('fs'),
    _handlebars = require('handlebars'),
    _http = require('http'),
    _moment = require('moment');


// Modify to configure planner
var args = {
    year: 2018,
    secondaryColor: "#1a80a0", // Steel blue
    //months: _moment.months()
    months: _moment.months().slice(4, 12)
};


function init() {
    _handlebars.registerPartial('future-planner', _fs.readFileSync('./partials/future_planner.html', 'utf8'));
    _handlebars.registerPartial('monthly-planner', _fs.readFileSync('./partials/monthly_planner.html', 'utf8'));
    _handlebars.registerPartial('weekly-planner', _fs.readFileSync('./partials/weekly_planner.html', 'utf8'));
    _handlebars.registerPartial('intro', _fs.readFileSync('./partials/intro.html', 'utf8'));
    _handlebars.registerPartial('legend', _fs.readFileSync('./partials/legend.html', 'utf8'));
    _handlebars.registerPartial('yearly-goals', _fs.readFileSync('./partials/yearly_goals.html', 'utf8'));


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
                else if (printedDate == 0 && timestamp.day() === col) {
                    out += ++printedDate;
                }
                out += "</td>";
            }
            out += "</tr>";
        }
        return out + "</table>";
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

    _handlebars.registerHelper('ifEq', function(v1, v2, options) {
        if (v1 == v2) {
            return options.fn(this);
        }
        return options.inverse(this);
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
            // Week 1 should only be at the beginning, rather than week 1 next year
            var week = start.endOf('week').year() != parseInt(this.year) ?  start.week() + 52 : start.week();
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
        var beginningOfYear = _moment().year(this.year).startOf('year'),
            momentStart = _moment(beginningOfYear).add(this.week - 1, 'weeks').startOf('week'),
            momentEnd = _moment(beginningOfYear).add(this.week, 'weeks').startOf('week');

        while (momentStart.isBefore(momentEnd)) {
            momentStart.add(1, 'days');
            out += options.fn(this, {data: {
                dayDate: momentStart.format('Dddd'),
                day: momentStart.day(),
                isWeekday: momentStart.day() != 6 && momentStart.day() != 0
            
            }});
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

if (process.argv.length === 3 && process.argv[2] === 'print') {
    console.log("Printing..");
    var template = init();

    _htmlPdf({
        html: template(args),
        allowLocalFilesAccess: true,
        paperSize: {
            format: 'A5'
        }
    }, function(err, pdf) {
        if (err) throw err;

        var output = _fs.createWriteStream('./output.pdf')
        console.log(pdf.logs);
        console.log(pdf.numberOfPages);
        // since pdf.stream is a node.js stream you can use it
        // to save the pdf to a file (like in this example) or to
        // respond an http request.
        pdf.stream.pipe(output);
        output.end();
    });
}
else {
    _http.createServer(function(req, resp) {
        var template = init();

        resp.writeHead(200, {'Content-Type': 'text/html'});
        resp.write(template(args));
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
        last += 52;
    }
    return last - first + 1;
}

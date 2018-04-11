var _htmlPdf = require('html-pdf'),
    _fs = require('fs'),
    _handlebars = require('handlebars'),
    _http = require('http'),
    _moment = require('moment');

function init() {
    _handlebars.registerPartial('future-planner', _fs.readFileSync('./future_planner.html', 'utf8'));
    _handlebars.registerPartial('monthly-planner', _fs.readFileSync('./monthly_planner.html', 'utf8'));


    _handlebars.registerHelper('calendar', function(month) {
        var timestamp = _moment({
            year: this.year,
            month: _moment().month(month).format("M") - 1
        });
        var out = "<table class=\"calendar\"><tr><td>S</td><td>M</td><td>Tu</td><td>W</td><td>Th</td><td>F</td><td>S</td></tr>";
        var printedDate = 0;

        for (var row = 0; row < 5; row++) {
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
            out += options.fn(Object.assign(context, this));
        }
        return out;
    });

    _handlebars.registerHelper('each-day-in-month', function(month, options) {
        var out = "";
        var daysInMonth = _moment({
            year: this.year,
            month: _moment().month(month).format("M") - 1
        }).daysInMonth();
        for (var i = 1; i <= daysInMonth; i++) {
            out += options.fn(Object.assign({day: i}, this));
        }
        return out;
    });

    _handlebars.registerHelper('days-in-month', function(month) {
        return _moment({
            year: this.year,
            month: _moment().month(month).format("M") - 1
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
        resp.write(template({year: "2018", months: _moment.months()}));
        resp.end();
    }).listen(8080);
}

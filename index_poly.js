var set = require('./set.js'); // 배터리 모듈의 설정 파일을 읽어온다.
var bat_count; // 전체 배터리 모듈의 갯수

var Promise = require("bluebird");
var express = require('express');
var path = require('path');
var app = express();
var CORS = require('cors')();
var battery = require('./battery_jbd.js');          // [20210906 Eugene] 배터리 모듈 분리 및 모듈 데이터 활용

app.use(CORS);

app.use(express.static(path.join(__dirname, 'html')));

app.use('/js_module', express.static(__dirname + "/js_module"));

app.use('/iconfont', express.static(__dirname + "/iconfont"));

app.use(express.json());

//Web Server용
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'html', 'ess.html'));
});

app.post('/send_schedule', function(request, response) {
    console.log(request.body); // your JSON
    response.send(request.body); // echo the result back
    //response.send({ OK: 'OK' }); // echo the result back
    var sch = request.body;
    sch = {
        "forecast": [0.9364596965185782, 2.4379276356206585, 4.649088869334584, 7.451670742281317, 10.685257687361304, 14.099636785312487, 17.421572904681224, 20.420525613767666, 22.897233903898314, 24.77529377746396, 26.017757194463936, 26.610795900846195, 26.669503926413626, 26.369296998378463, 25.78901952670893, 25.066801233524913, 24.339263916843148, 23.655813666731177, 23.138588579398952, 22.826742469445854, 22.68158748735736, 22.669024378335962, 22.749370671665147, 22.85399180962132, 22.94590641753857, 23.015552052200373, 23.11669537263833, 23.28941118936357, 23.55132992211133, 23.949956676354763, 24.495565938062512, 25.170539504829243, 25.86225214434537, 26.512489420488205, 27.03099169529049, 27.28838268933627, 27.173148938556327, 26.677497586690375, 25.756942050060815, 24.41779894994988, 22.732032225343648, 20.753593045884486, 18.60199952737408, 16.381346652541147, 14.158149371410598, 12.020984425109177, 10.00416133517386, 8.128345698468934, 6.414878666541923, 4.856674209107757, 3.467452919146253, 2.263093262142128, 1.2351208723999951, 0.3648837384892966, -0.3636688600572076, -0.9412398819868544, -1.3949266218969032, -1.7351380985608231, -1.9616658942910432, -2.0661699157637496, -2.070185406038023, -2.029650852750792, -1.957791520316903, -1.8828479646737524, -1.8192302399759808, -1.7360636010177328, -1.6349049570014909, -1.5186834660407045, -1.3954719859564448, -1.2478498611947308, -1.0858390125442048, -0.9528280603090395, -0.8485392237765875, -0.789564352038478, -0.7674478896925954, -0.7765912014327715, -0.7968606797281688, -0.8215233254045703, -0.8639057157110301, -0.904712036896995, -0.919842987202992, -0.9101849678358336, -0.8385005612141253, -0.6683986798405928, -0.4356284593878898, -0.19273668943266387, 0.005795209512102226, 0.13773874626954924, 0.12125557314057753, -0.06348857007168487, -0.3873038602573354, -0.7903915390969302, -1.1911581268467188, -1.4900001120402384, -1.5410239496345743, -1.2481625384595612],
        "control": [0.48066729559988214, 1.1297681341248351, 2.434630688002696, 5.051928580021844, 10.631779264700668, 16.578251597311493, 20.344158052094304, 21.94247657742939, 22.601574841314534, 22.60157483891267, 22.60157483906712, 22.601574839173175, 22.601574839224156, 22.601574839239326, 22.60157483923478, 22.601574839226824, 22.601574839223932, 22.601574839226025, 22.60157483923071, 22.60157483923468, 22.601574839236218, 22.601574839234868, 22.60157483923064, 22.601574839223858, 22.601574839214702, 22.601574839203273, 22.601574839189333, 22.601574839172795, 22.60157483915445, 22.60157483913688, 22.60157483912677, 22.60157483913558, 22.60157483916995, 22.60157483922513, 22.60157483927806, 22.601574839294955, 22.60157483926319, 22.60157483920587, 22.601574839132898, 22.60157483899432, 22.60157484219291, 22.00644351363324, 21.13371750666133, 19.563655508984578, 16.90528770825252, 13.4971209256741, 9.638513736816678, 6.153982502527637, 3.976936548160802, 2.5496659465983, 1.611752668866836, 0.9830497822508015, 0.5533173308885766, 0.11654710244953143, -0.34150031583667356, -0.9240299497234228, -1.3807106351157676, -1.7228843345827993, -1.9508128312092587, -2.0563797498995755, -2.0612382255404333, -2.02139466762179, -1.9501163080874757, -1.8756710908588528, -1.8124877318259116, -1.729704646219816, -1.6288882822732065, -1.5129748643058727, -1.3900425736532753, -1.2426748156237826, -1.080896634087385, -0.9480990600950062, -0.8440061713153065, -0.7852112387215667, -0.7632597779496281, -0.7725539386662661, -0.7929606626597703, -0.8177473052338029, -0.8602406382295336, -0.9011449149239116, -0.916360805807747, -0.9067746261261397, -0.8351488582716791, -0.6650923568840663, -0.432354315445664, -0.18948179329203768, 0.0032478638167702735, 0.0032494074856815602, 0.003247072757169872, -0.06348505085419813, -0.38730208835236474, -0.7903901952593646, -1.191156937302134, -1.489998984193878, -1.5410228440429348, -1.2481614320891332],
        "datetime": ["2018-09-19T22:15:00+00:00", "2018-09-19T22:30:00+00:00", "2018-09-19T22:45:00+00:00", "2018-09-19T23:00:00+00:00", "2018-09-19T23:15:00+00:00", "2018-09-19T23:30:00+00:00", "2018-09-19T23:45:00+00:00", "2018-09-20T00:00:00+00:00", "2018-09-20T00:15:00+00:00", "2018-09-20T00:30:00+00:00", "2018-09-20T00:45:00+00:00", "2018-09-20T01:00:00+00:00", "2018-09-20T01:15:00+00:00", "2018-09-20T01:30:00+00:00", "2018-09-20T01:45:00+00:00", "2018-09-20T02:00:00+00:00", "2018-09-20T02:15:00+00:00", "2018-09-20T02:30:00+00:00", "2018-09-20T02:45:00+00:00", "2018-09-20T03:00:00+00:00", "2018-09-20T03:15:00+00:00", "2018-09-20T03:30:00+00:00", "2018-09-20T03:45:00+00:00", "2018-09-20T04:00:00+00:00", "2018-09-20T04:15:00+00:00", "2018-09-20T04:30:00+00:00", "2018-09-20T04:45:00+00:00", "2018-09-20T05:00:00+00:00", "2018-09-20T05:15:00+00:00", "2018-09-20T05:30:00+00:00", "2018-09-20T05:45:00+00:00", "2018-09-20T06:00:00+00:00", "2018-09-20T06:15:00+00:00", "2018-09-20T06:30:00+00:00", "2018-09-20T06:45:00+00:00", "2018-09-20T07:00:00+00:00", "2018-09-20T07:15:00+00:00", "2018-09-20T07:30:00+00:00", "2018-09-20T07:45:00+00:00", "2018-09-20T08:00:00+00:00", "2018-09-20T08:15:00+00:00", "2018-09-20T08:30:00+00:00", "2018-09-20T08:45:00+00:00", "2018-09-20T09:00:00+00:00", "2018-09-20T09:15:00+00:00", "2018-09-20T09:30:00+00:00", "2018-09-20T09:45:00+00:00", "2018-09-20T10:00:00+00:00", "2018-09-20T10:15:00+00:00", "2018-09-20T10:30:00+00:00", "2018-09-20T10:45:00+00:00", "2018-09-20T11:00:00+00:00", "2018-09-20T11:15:00+00:00", "2018-09-20T11:30:00+00:00", "2018-09-20T11:45:00+00:00", "2018-09-20T12:00:00+00:00", "2018-09-20T12:15:00+00:00", "2018-09-20T12:30:00+00:00", "2018-09-20T12:45:00+00:00", "2018-09-20T13:00:00+00:00", "2018-09-20T13:15:00+00:00", "2018-09-20T13:30:00+00:00", "2018-09-20T13:45:00+00:00", "2018-09-20T14:00:00+00:00", "2018-09-20T14:15:00+00:00", "2018-09-20T14:30:00+00:00", "2018-09-20T14:45:00+00:00", "2018-09-20T15:00:00+00:00", "2018-09-20T15:15:00+00:00", "2018-09-20T15:30:00+00:00", "2018-09-20T15:45:00+00:00", "2018-09-20T16:00:00+00:00", "2018-09-20T16:15:00+00:00", "2018-09-20T16:30:00+00:00", "2018-09-20T16:45:00+00:00", "2018-09-20T17:00:00+00:00", "2018-09-20T17:15:00+00:00", "2018-09-20T17:30:00+00:00", "2018-09-20T17:45:00+00:00", "2018-09-20T18:00:00+00:00", "2018-09-20T18:15:00+00:00", "2018-09-20T18:30:00+00:00", "2018-09-20T18:45:00+00:00", "2018-09-20T19:00:00+00:00", "2018-09-20T19:15:00+00:00", "2018-09-20T19:30:00+00:00", "2018-09-20T19:45:00+00:00", "2018-09-20T20:00:00+00:00", "2018-09-20T20:15:00+00:00", "2018-09-20T20:30:00+00:00", "2018-09-20T20:45:00+00:00", "2018-09-20T21:00:00+00:00", "2018-09-20T21:15:00+00:00", "2018-09-20T21:30:00+00:00", "2018-09-20T21:45:00+00:00", "2018-09-20T22:00:00+00:00"]
    };
    if (sch.forecast.length < 96) return;
    mdb.collection("forecast").insertOne(tdb, function(err, result) {
        if (err) console.log(err);

    });
    

});

// [20210906 Eugene] 배터리 모듈 분리 및 모듈 데이터 활용
// BMS 상태 알려줌 (BMS가 2개 있는 상황)
app.get("/current_bms", function(req, res) {
    var re = battery.getJSON();
    res.json(re);
});

/*// BMS 상태 알려줌 (BMS가 2개 있는 상황)
app.get("/current_bms", function(req, res) {
    var re = [];
    re.push(value_bms1);
    res.json(re);
});*/

app.get("/set_operation", function(req, res) {
    var date = new Date();
    //console.log(req.query.date);
    var mode = req.query.mode;
    var pw = req.query.pwr;
    var re;
    console.log(date + " set_operation : " + mode + "/" + pw);
    if (mode == 'charge') {
        pw = pw * 1;
        if (pw > set.num_of_batt * 1500) pw = set.num_of_batt * 1500;
        run.pwr = pw;
        mode_charge(pw);
        re = {
            mode: 'charge',
            pwr: pw
        };
        res.json(re);
    } else if (mode == 'discharge') {
        if (SOC_Now > 10) // 배터리 용량이 10%이상일 경우에만 방전을 수행한다.
        {
            pw = pw * 1;
            if (pw > set.num_of_batt * 1500) pw = set.num_of_batt * 1500;
            run.pwr = pw;
            mode_discharge(pw);
            re = {
                mode: 'discharge',
                pwr: pw
            };
            res.json(re);
        } else {
            mode_idle();
            re = {
                mode: 'idle',
                pwr: 0
            };
            res.json(re);
        }

    } else if (mode == 'idle') {
        mode_idle();
        run.pwr = 0;
        re = {
            mode: 'idle',
            pwr: 0
        };
        res.json(re);
    } else {
        re = {
            mode: 'invalid',
            pwr: 0
        };
        res.json(re);
    }
});


var run = {
    mode: 'idle',
    pwr: 0
};

//verdi용

app.get("/get_rate", function(req, res) {
    res.json(set.rates);
});


app.get("/send_opti", function(req, res) {
    var ins = req.query.ins;
    console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + "send_opti " + "ins = " + ins);
    port_opti.write(ins + "\r");
    res.json('ok');
});


app.get("/current_kwhq", function(req, res) {
    if (mongoconnected) {
        if (res_kwhq.alive < 10)
            res.json(res_kwhq);
        else {
            check_kwhq().then(function(databack) {
                //console.log(total);
                res.json(databack);
            });
        }
    } else {
        res.json(res_kwhq);
    }
});


app.get("/log_month", function(req, res) {
    var spl = req.query.date.split("_");
    console.log("0=" + spl[0]);
    console.log("1=" + spl[1]);
    var mt = Number(spl[0]) - 1;
    var yt = Number(spl[1]);
    var mon = new Date(yt, mt, 1);

    var logmonth = moment(mon);
    console.log(logmonth);

    log_monthly(logmonth).then(function(total) {
        //console.log(total);
        res.json(total);
    });
});


function log_monthly(month) {
    return new Promise(function(resolve, reject) {
        console.log(month.format());
        var t1 = new Date(month.format());
        var t2 = new Date(month.format());
        console.log(t1);
        console.log(t2);
        t2.setMonth(t1.getMonth() + 1);
        var res_month = {
            solar: 0,
            ph1_load: 0,
            ph2_load: 0,
            ph3_load: 0,
            ph1_power: 0,
            ph2_power: 0,
            ph3_power: 0,
            battery: 0,
            arr_solar: [],
            arr_datetimes: [],
            arr_ph1_load: [],
            arr_ph2_load: [],
            arr_ph3_load: [],
            arr_ph1_power: [],
            arr_ph2_power: [],
            arr_ph3_power: [],
            arr_battery: [],
            arr_battery_power: []
        };
        // 조회일의 00시부터 현재 시간까지 시간별 Kwh데이터를 쿼리한다.
        var qr = {
            "datetime": {
                $gte: new Date(t1.getFullYear(), t1.getMonth(), 1, 0, 0),
                $lt: new Date(t2.getFullYear(), t2.getMonth(), 1, 0, 0)
            }
        };
        //console.log("월간별 log조회를 시작한다.");
        //console.log(qr);
        mdb.collection('sum_d').find(qr).toArray(function(err, result) {
            if (err) console.log(err); //throw err;
            else {
                if (result.length > 0) {
                    //console.log("sum_d에서" + result.length + "개가 조회됨");
                    result.forEach(function(el, idx, arr) {
                        res_month.solar += Number(el.Solar_input_power_1);
                        res_month.ph1_load += Number(el.ph1_power) + (Number(el.Solar_input_power_1) / 3) - (Number(el.Battery_Power) / 3);
                        res_month.ph2_load += Number(el.ph2_power) + (Number(el.Solar_input_power_1) / 3) - (Number(el.Battery_Power) / 3);
                        res_month.ph3_load += Number(el.ph3_power) + (Number(el.Solar_input_power_1) / 3) - (Number(el.Battery_Power) / 3);
                        res_month.ph1_power += Number(el.ph1_power);
                        res_month.ph2_power += Number(el.ph2_power);
                        res_month.ph3_power += Number(el.ph3_power);
                        res_month.battery += Number(el.Battery_capacity);
                        res_month.arr_datetimes.push(el.datetime);
                        res_month.arr_solar.push(Number(el.Solar_input_power_1));
                        res_month.arr_ph1_load.push(Number(el.ph1_load));
                        res_month.arr_ph2_load.push(Number(el.ph2_load));
                        res_month.arr_ph3_load.push(Number(el.ph3_load));
                        res_month.arr_ph1_power.push(Number(el.ph1_power));
                        res_month.arr_ph2_power.push(Number(el.ph2_power));
                        res_month.arr_ph3_power.push(Number(el.ph3_power));
                        res_month.arr_battery.push(Number(el.Battery_capacity));
                        res_month.arr_battery_power.push(Number(el.Battery_Power));
                    });
                    //resolve(JSON.stringify(res_month));
                    resolve(res_month);
                } else console.log("해당 월의 sum_d의 " + qr + "에서 데이터가 조회되지 않음");
            }
        });
    });
}

app.get("/log_day", function(req, res) {
    //console.log(req.query.date);
    var logday = moment(req.query.date);
    //console.log(logday);

    log_daily(logday).then(function(total) {
        //console.log(total);
        res.json(total);
    });
});
app.get("/log_report", function(req, res) {
    //console.log(req.query.date);
    var logday = moment(req.query.date);
    //console.log(logday);

    log_daily(logday).then(function(total) {
        //console.log(total);
        var csvstr = ConvertToCSV(total);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=' + req.query.date + '.csv');
        res.send(csvstr);
    });
});

function ConvertToCSV(ob) {
    var str = ''; // csv 
    var rows = Object.getOwnPropertyNames(ob);

    console.log(rows);
    var rows_cnt = rows.length;
    var col_cnt = 0;
    var i = 0;
    //debugger
    for (i = 0; i < rows_cnt; i++) {
        if (ob[rows[i]].length > col_cnt) // obj안에 있는 배열 길이중에서 가장 긴 놈을 찾는다.
            col_cnt = ob[rows[i]].length;
        str += rows[i] + "";
        if (i == (rows_cnt - 1))
            break;
        str += "," + "";
    }
    str += "\r\n";

    var j = 0;
    for (j = 0; j < col_cnt; j++) {
        for (i = 0; i < rows_cnt; i++) {
            if (ob[rows[i]].length > j)
                str += ob[rows[i]][j];
            else if (j == 0)
                str += ob[rows[i]];
            if (i == (rows_cnt - 1)) {
                str += "\r\n";
                break;
            }
            str += "," + "";
        }
    }
    return str;
}



function log_daily(day) {
    return new Promise(function(resolve, reject) {
        var t1 = new Date(day.format());
        var t2 = new Date(day.format());
        t2.setDate(t1.getDate() + 1);
        var res_day = {
            solar: 0,
            ph1_load: 0,
            ph2_load: 0,
            ph3_load: 0,
            ph1_power: 0,
            ph2_power: 0,
            ph3_power: 0,
            battery: 0,
            arr_datetimes: [],
            arr_solar: [],
            arr_ph1_load: [],
            arr_ph2_load: [],
            arr_ph3_load: [],
            arr_ph1_power: [],
            arr_ph2_power: [],
            arr_ph3_power: [],
            arr_battery: [],
            arr_battery_power: []
        };
        // 조회일의 00시부터 현재 시간까지 시간별 Kwh데이터를 쿼리한다.
        var qr = {
            "datetime": {
                $gte: new Date(t1.getFullYear(), t1.getMonth(), t1.getDate(), 0, 0),
                $lt: new Date(t2.getFullYear(), t2.getMonth(), t2.getDate(), 0, 2)
            }
        };
        //console.log("일간별 log조회를 시작한다.");
        //console.log(qr);
        mdb.collection('sum_q').find(qr).toArray(function(err, result) {
            //mdb.collection('sum_h').find(qr).toArray.then(function(err, result) {
            if (err) console.log(err); //throw err;
            else {
                if (result.length > 0) {
                    //console.log("sum_h에서" + result.length + "개가 조회됨");
                    result.forEach(function(el, idx, arr) {
                        //console.log(el);
                        res_day.solar += Number(el.Solar_input_power_1 + el.Solar_input_power_2);
                        res_day.ph1_load += Number(el.ph1_power) + (Number(el.Solar_input_power_1 + el.Solar_input_power_2) / 3) - (Number(el.Battery_Power) / 3);
                        res_day.ph2_load += Number(el.ph2_power) + (Number(el.Solar_input_power_1 + el.Solar_input_power_2) / 3) - (Number(el.Battery_Power) / 3);
                        res_day.ph3_load += Number(el.ph3_power) + (Number(el.Solar_input_power_1 + el.Solar_input_power_2) / 3) - (Number(el.Battery_Power) / 3);
                        res_day.ph1_power += Number(el.ph1_power);
                        res_day.ph2_power += Number(el.ph2_power);
                        res_day.ph3_power += Number(el.ph3_power);
                        res_day.battery += Number(el.Battery_capacity);
                        res_day.arr_datetimes.push(el.datetime);
                        res_day.arr_solar.push(Number(el.Solar_input_power_1 + el.Solar_input_power_2));
                        res_day.arr_ph1_load.push(Number(el.ph1_load));
                        res_day.arr_ph2_load.push(Number(el.ph2_load));
                        res_day.arr_ph3_load.push(Number(el.ph3_load));
                        res_day.arr_ph1_power.push(Number(el.ph1_power));
                        res_day.arr_ph2_power.push(Number(el.ph2_power));
                        res_day.arr_ph3_power.push(Number(el.ph3_power));
                        res_day.arr_battery.push(Number(el.Battery_capacity));
                        res_day.arr_battery_power.push(Number(el.Battery_Power));
                    });
                    //resolve(JSON.stringify(res_day));
                    resolve(res_day);

                } else console.log("해당 날짜의 sum_q의 " + qr + "에서 데이터가 조회되지 않음");
            }
        });
    });
}

// ESS 현재 상태 알려줌
app.get("/current_ess", function(req, res) {
    var battery_pwr, ph1_load, ph2_load, ph3_load;
    var res_ess = {
        datetime: new Date(),
        Solar_input_voltage_1: 0,
        Solar_input_power_1: 0,
        Solar_input_voltage_2: 0,
        Solar_input_power_2: 0,
        Battery_voltage: 0,
        Battery_capacity: 0,
        Battery_current: 0,
        Battery_Power: 0,
        ph1_volt: 0,
        ph2_volt: 0,
        ph3_volt: 0,
        ph1_current: 0,
        ph2_current: 0,
        ph3_current: 0,
        ph1_power: 0,
        ph2_power: 0,
        ph3_power: 0,
        ph1_powerVA: 0,
        ph2_powerVA: 0,
        ph3_powerVA: 0,
        ph1_load: 0,
        ph2_load: 0,
        ph3_load: 0,
        ph1_amp_reactive: 0,
        ph2_amp_reactive: 0,
        ph3_amp_reactive: 0,
        ph1_pf: 0,
        ph2_pf: 0,
        ph3_pf: 0,
    };
    res_ess.datetime = new Date();
    res_ess.Solar_input_voltage_1 = Number(value_gs.Solar_input_voltage_1.toFixed(2));
    res_ess.Solar_input_power_1 = Number(value_gs.Solar_input_power_1.toFixed(2));
    res_ess.Solar_input_voltage_2 = Number(value_gs.Solar_input_voltage_2.toFixed(2));
    res_ess.Solar_input_power_2 = Number(value_gs.Solar_input_power_2.toFixed(2));
    res_ess.Battery_voltage = Number(value_gs.Battery_voltage.toFixed(2));
    res_ess.Battery_capacity = Number(SOC_Now);
    res_ess.Battery_current = Number(value_gs.Battery_current.toFixed(2));
    res_ess.Battery_Power = Number((value_gs.Battery_voltage * value_gs.Battery_current).toFixed(2));
    res_ess.ph1_volt = Number(value_gs.AC_input_voltage_R.toFixed(2));
    res_ess.ph2_volt = Number(value_gs.AC_input_voltage_S.toFixed(2));
    res_ess.ph3_volt = Number(value_gs.AC_input_voltage_T.toFixed(2));
    
    if(value_gs.AC_input_voltage_R > 0) 
        res_ess.ph1_current = Number((value_ps.AC_input_active_power_R / value_gs.AC_input_voltage_R).toFixed(2));
    else
        res_ess.ph1_current = 0;
    
    if(value_gs.AC_input_voltage_S > 0) 
        res_ess.ph2_current = Number((value_ps.AC_input_active_power_S / value_gs.AC_input_voltage_S).toFixed(2));
    else
        res_ess.ph2_current = 0;
    
    if(value_gs.AC_input_voltage_T > 0) 
        res_ess.ph3_current = Number((value_ps.AC_input_active_power_T / value_gs.AC_input_voltage_T).toFixed(2));
    else
        res_ess.ph3_current = 0;

    res_ess.ph1_power = Number(value_ps.AC_input_active_power_R);
    res_ess.ph2_power = Number(value_ps.AC_input_active_power_S);
    res_ess.ph3_power = Number(value_ps.AC_input_active_power_T);
    res_ess.ph1_powerVA = 0;
    res_ess.ph2_powerVA = 0;
    res_ess.ph3_powerVA = 0;
    res_ess.ph1_load = Number(value_ps.AC_output_active_power_R);
    res_ess.ph2_load = Number(value_ps.AC_output_active_power_S);
    res_ess.ph3_load = Number(value_ps.AC_output_active_power_T);
    res_ess.ph1_amp_reactive = 0;
    res_ess.ph2_amp_reactive = 0;
    res_ess.ph3_amp_reactive = 0;
    res_ess.ph1_pf = 0;
    res_ess.ph2_pf = 0;
    res_ess.ph3_pf = 0;
    

    //res_ess.Battery_capacity = tofn(SOC_Now, 3);

    res.json(res_ess);

});

var bat_ID;

app.listen(80, function() {
    console.log('Express App on port 8080!');
    bat_count = set.battery_count; // Express를 실행함과 동시에 배터리 카운트를 설정파일에서 동기화한다.
    bat_ID = set.ID; // 배터리 ID배열을 동기화 한다.
    //console.log(set.battery_count + "개의 배터리 정보");
    //console.log(bat_ID + "아이디 정보");
    //bat_init(); // 배터리 별로 구조체 형태의 변수를 만들어서 ID를 삽입한다.
});


//var mongodb = require('mongodb');
var mongodb = Promise.promisifyAll(require("mongodb"));
var MongoClient = mongodb.MongoClient;
//var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";
var mdb = null;

var mongoconnected = false;
MongoClient.connect(url, function(err, db) {
    if (err) {
        console.log("ERROR : " + err); //throw err;
    }
    mdb = db;
    mongoconnected = true;
    console.log("MongoDB Connected!");
    //check_kwh().then(function(total) {
    //    console.log(total);
    //});
});

var res_kwhq = {
    solar: 0,
    ph1_load: 0,
    ph2_load: 0,
    ph3_load: 0,
    ph1_power: 0,
    ph2_power: 0,
    ph3_power: 0,
    battery: 0,
    arr_solar: [],
    arr_datetimes: [],
    arr_ph1_load: [],
    arr_ph2_load: [],
    arr_ph3_load: [],
    arr_ph1_power: [],
    arr_ph2_power: [],
    arr_ph3_power: [],
    arr_battery: [],
    arr_index: [],
    alive: 999
};
var qhour_ph1_power = 0;
var qhour_ph2_power = 0;
var qhour_ph3_power = 0;

function check_kwhq() {
    return new Promise(function(resolve, reject) {
        var t1 = new Date();
        var t2 = new Date();
        t2.setDate(t1.getDate() + 1);
        res_kwhq = {
            solar: 0,
            ph1_load: 0,
            ph2_load: 0,
            ph3_load: 0,
            ph1_power: 0,
            ph2_power: 0,
            ph3_power: 0,
            battery: 0,
            arr_solar: [],
            arr_datetimes: [],
            arr_ph1_load: [],
            arr_ph2_load: [],
            arr_ph3_load: [],
            arr_ph1_power: [],
            arr_ph2_power: [],
            arr_ph3_power: [],
            arr_battery: [],
            arr_index: [],
            arr_battery_power: [],
            alive: 0
        };

        // 오늘 00시부터 현재 시간까지 시간별 Kwh데이터를 쿼리한다.
        var qr = {
            "datetime": {
                $gte: new Date(t1.getFullYear(), t1.getMonth(), t1.getDate(), 0, 0),
                $lt: new Date(t2.getFullYear(), t2.getMonth(), t2.getDate(), 0, 1)
            }
        };
        //console.log(qr);
        mdb.collection('sum_q').find(qr).toArray(function(err, result) {
            //mdb.collection('sum_h').find(qr).toArray.then(function(err, result) {
            if (err) console.log(err); //throw err;
            else {
                if (result.length > 0) {
                    //console.log("check_kwhq 시간별 조회");
                    //console.log("sum_q에서" + result.length + "개가 조회됨");
                    result.forEach(function(el, idx, arr) {
                        res_kwhq.solar += Number(el.Solar_input_power_1);
                        res_kwhq.ph1_load += Number(el.ph1_load);
                        res_kwhq.ph2_load += Number(el.ph2_load);
                        res_kwhq.ph3_load += Number(el.ph3_load);
                        res_kwhq.ph1_power += Number(el.ph1_power);
                        res_kwhq.ph2_power += Number(el.ph2_power);
                        res_kwhq.ph3_power += Number(el.ph3_power);
                        res_kwhq.battery += Number(el.Battery_capacity);
                        res_kwhq.arr_datetimes.push(el.datetime);
                        res_kwhq.arr_solar.push(Number(Number(el.Solar_input_power_1).toFixed(2)));
                        res_kwhq.arr_ph1_load.push(Number(Number(el.ph1_load).toFixed(2)));
                        res_kwhq.arr_ph2_load.push(Number(Number(el.ph2_load).toFixed(2)));
                        res_kwhq.arr_ph3_load.push(Number(Number(el.ph3_load).toFixed(2)));
                        //total.arr_ph1_load.push(Number(el.ph1_load));
                        //total.arr_ph2_load.push(Number(el.ph2_load));
                        //total.arr_ph3_load.push(Number(el.ph3_load));
                        res_kwhq.arr_ph1_power.push(Number(Number(el.ph1_power).toFixed(2)));
                        res_kwhq.arr_ph2_power.push(Number(Number(el.ph2_power).toFixed(2)));
                        res_kwhq.arr_ph3_power.push(Number(Number(el.ph3_power).toFixed(2)));
                        res_kwhq.arr_battery.push(Number(Number(el.Battery_capacity).toFixed(2)));
                        res_kwhq.arr_battery_power.push(Number(el.Battery_Power).toFixed(2));
                        res_kwhq.arr_index.push(el.index);
                        //res_kwhq.arr_index.push(Number(el.index));
                    });

                    var tmp_solar;
                    var tmp_bat_pwr;
                    var tmp_bat_cap;
                    if (value_gs_ar.cnt > 0) {
                        tmp_solar = value_gs_ar.Solar_input_power_1.average();
                        tmp_bat_pwr = value_gs_ar.Battery_voltage.average() * value_gs_ar.Battery_current.average();
                    } else {
                        tmp_solar = 0;
                        tmp_bat_pwr = 0;
                        tmp_bat_cap = 0;
                    }
                    tmp_bat_cap = SOC_Now;

                    var tmp_ph1_pwr;
                    var tmp_ph2_pwr;
                    var tmp_ph3_pwr;

                    tmp_ph1_pwr = value_ps_ar.AC_input_active_power_R.average();
                    tmp_ph2_pwr = value_ps_ar.AC_input_active_power_S.average();
                    tmp_ph3_pwr = value_ps_ar.AC_input_active_power_T.average();
                    qhour_ph1_power = tmp_ph1_pwr;
                    qhour_ph2_power = tmp_ph2_pwr;
                    qhour_ph3_power = tmp_ph3_pwr;
                    
                    var tmp_ph1_load = value_ps_ar.AC_output_active_power_R.average();
                    var tmp_ph2_load = value_ps_ar.AC_output_active_power_S.average();
                    var tmp_ph3_load = value_ps_ar.AC_output_active_power_T.average();

                    var d = new Date();

                    res_kwhq.solar += tmp_solar;
                    res_kwhq.ph1_load += tmp_ph1_load;
                    res_kwhq.ph2_load += tmp_ph2_load;
                    res_kwhq.ph3_load += tmp_ph3_load;
                    res_kwhq.ph1_power += tmp_ph1_pwr;
                    res_kwhq.ph2_power += tmp_ph2_pwr;
                    res_kwhq.ph3_power += tmp_ph3_pwr;
                    res_kwhq.battery += value_gs_ar.Battery_capacity.average();
                    res_kwhq.arr_datetimes.push(new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()));
                    res_kwhq.arr_solar.push(Number(tmp_solar.toFixed(2)));
                    res_kwhq.arr_ph1_load.push(Number(tmp_ph1_load.toFixed(2)));
                    res_kwhq.arr_ph2_load.push(Number(tmp_ph2_load.toFixed(2)));
                    res_kwhq.arr_ph3_load.push(Number(tmp_ph3_load.toFixed(2)));
                    res_kwhq.arr_ph1_power.push(Number(tmp_ph1_pwr.toFixed(2)));
                    res_kwhq.arr_ph2_power.push(Number(tmp_ph2_pwr.toFixed(2)));
                    res_kwhq.arr_ph3_power.push(Number(tmp_ph3_pwr.toFixed(2)));
                    res_kwhq.arr_battery.push(Number(tmp_bat_cap.toFixed(2)));

                    res_kwhq.solar = Number(res_kwhq.solar.toFixed(2));
                    res_kwhq.ph1_load = Number(res_kwhq.ph1_load.toFixed(2));
                    res_kwhq.ph2_load = Number(res_kwhq.ph2_load.toFixed(2));
                    res_kwhq.ph3_load = Number(res_kwhq.ph3_load.toFixed(2));
                    res_kwhq.ph1_power = Number(res_kwhq.ph1_power.toFixed(2));
                    res_kwhq.ph2_power = Number(res_kwhq.ph2_power.toFixed(2));
                    res_kwhq.ph3_power = Number(res_kwhq.ph3_power.toFixed(2));
                    res_kwhq.battery = Number(res_kwhq.battery.toFixed(2));
                    res_kwhq.arr_battery_power.push(Number(tmp_bat_pwr).toFixed(2));
                    res_kwhq.arr_index.push(Number(d.getHours() * 60 + d.getMinutes()));
                    //res_kwhq.index.push(Number(d.getHours() * 60 + d.getMinutes()));
                    resolve(res_kwhq);

                } else {
                    resolve(res_kwhq);
                    //console.log("sum_h의 " + qr + "에서 시간별 데이터가 조회되지 않음");
                }


            }
        });

    });
}


var crc = require('crc'); // crc16 xmodem 계산용
var moment = require('moment'); //moment

process.on('uncaughtException', function(err) {
    console.error(err.stack);
    console.log("Node NOT Exiting...");
});

var SerialPort = require('serialport');
var port_opti = new SerialPort(set.port_opti, {
    baudRate: 2400
});

// Open errors will be emitted as an error event 
port_opti.on('error', function(err) {
    console.log('Error: ', err.message);
});

port_opti.on('data', function(data) {
    //console.log(data);
    data.forEach(function(el, idx, arr) {
        func_opti_rcv(el);
    });
});

/*
port.open(function(err) {
    if (err) {
        return console.log('!?Error opening port: ', err.message);
    };
});
*/

var crc_ok = 0;
var crc_fail = 0;
var data_accu = null; // 데이터 수신 및 누적하는 함수
var data_stage = 0; // 데이터 수신 스테이지
var data_type = null; // 데이터 타입
var data_rcv_count = 0; // 데이터 실제 수신 갯수
var data_length; // 데이터 길이
var data_crc1 = null; // CRC1
var data_crc2 = null;

function func_opti_rcv(rcv) {

    rcv_char = String.fromCharCode(rcv);
    //console.log(rcv_char);
    //process.stdout.write(rcv_char);
    // stage 0 : waiting Header
    if (data_stage == 0 && rcv_char == '^') {
        data_stage = 1;
        data_accu = "^";
        data_length = 0;
        data_rcv_count = 1;
        data_crc1 = null;
        data_crc2 = null;
    }
    // stage 1 : waiting : data type
    else if (data_stage == 1) {
        if (rcv_char == '0' || rcv_char == '1') {
            data_accu += rcv_char;
            data_stage = 6;
            data_rcv_count = 2;
        } else {
            data_type = rcv_char;
            data_accu += rcv_char;
            data_stage = 2;
            data_rcv_count = 2;
        }
    }
    // stage 2 : waiting : data length of X 100
    else if (data_stage == 2) {
        data_length = parseInt(rcv_char) * 100;
        data_accu += rcv_char;
        data_stage = 3;
        data_rcv_count = 3;
    }

    // stage 3 : waiting : data length of X 10
    else if (data_stage == 3) {
        data_length += parseInt(rcv_char) * 10;
        data_accu += rcv_char;
        data_stage = 4;
        data_rcv_count = 4;
    }
    // stage 4 : waiting : data length of X 1
    else if (data_stage == 4) {
        data_length += parseInt(rcv_char);
        data_accu += rcv_char;
        data_stage = 5;
        data_rcv_count = 5;
    }
    // stage 5 : waiting : data
    else if (data_stage == 5 && data_rcv_count < (data_length + 2)) {
        data_accu += rcv_char;
        data_rcv_count++;
        if (data_rcv_count == (data_length + 2)) { data_stage = 6; }
    }
    // stage 6 : waiting : crc1
    else if (data_stage == 6) {
        data_crc1 = rcv;
        data_stage = 7;
    }
    // stage 7 : waiting : crc2
    else if (data_stage == 7) {
        data_crc2 = rcv;
        data_stage = 8;
    }
    // stage 8 : waiting \r and end
    else if (data_stage == 8 && rcv_char == "\r") {
        var crccalc = crc.crc16xmodem(data_accu);
        if (crccalc == (data_crc1 * 0x100 + data_crc2)) {
            parser(data_accu, data_type, data_length, data_rcv_count);
            //crc_ok++;
            //console.log("Collect!");
        } else {
            crc_fail++;
            //process.stdout.write("CRC FAIL = length/cnt:" + data_length + "/" + data_rcv_count + "-" + data_accu + "/CRC/" + data_crc1.toString(16).toUpperCase() + "-" + data_crc2.toString(16).toUpperCase() + "/=" + crccalc.toString(16).toUpperCase() + "\n");
        }
        //process.stdout.write("length/cnt:" + data_length + "/" + data_rcv_count + "-" + data_accu + "CRC" + data_crc1.toString(16).toUpperCase() + "-" + data_crc2.toString(16).toUpperCase() + "/=" + crccalc.toString(16).toUpperCase() + "\n");
        //process.stdout.write("\rOK=" + crc_ok + "/FAIL=" + crc_fail);
        data_stage = 0;
        //console.log(data_accu);
        //process.stdout.write('e');
    } else {
        data_stage = 0;
        //console.log("!?");
    }

}




var value_gs = {
    Solar_input_voltage_1: 0,
    Solar_input_voltage_2: 0,
    Solar_input_current_1: 0,
    Solar_input_current_2: 0,
    Solar_input_power_1: 0,
    Solar_input_power_2: 0,
    Battery_voltage: 0,
    Battery_capacity: 0,
    Battery_current: 0,
    AC_input_voltage_R: 220,
    AC_input_voltage_S: 220,
    AC_input_voltage_T: 220,
    AC_input_frequency: 0,
    AC_input_current_R: 0,
    AC_input_current_S: 0,
    AC_input_current_T: 0,
    AC_output_voltage_R: 220,
    AC_output_voltage_S: 220,
    AC_output_voltage_T: 220,
    AC_output_frequency: 0,
    
    Inner_temperature: 0,
    External_battery_temperature: 0,
    Alive: 99,
    cnt: 0
};

var value_ps = {
    Solar_input_power1: 0,
    Solar_input_power2: 0,
    AC_input_active_power_R: 0,
    AC_input_active_power_S: 0,
    AC_input_active_power_T: 0,
    AC_input_total_active_power: 0,
    AC_output_active_power_R: 0,
    AC_output_active_power_S: 0,
    AC_output_active_power_T: 0,
    AC_output_total_active_power: 0,
    AC_output_apperent_power_R: 0,
    AC_output_apperent_power_S: 0,
    AC_output_apperent_power_T: 0,
    AC_output_total_apperent_power: 0,
    AC_output_power_percentage: 0,
    AC_output_connect_status: 0,
    Solar_input_1_work_status: 0,
    Solar_input_2_work_status: 0,
    Battery_power_direction: 0,
    DCAC_power_direction: 0,
    Line_power_direction: 0,
    Alive: 99,
    cnt: 0
};
var value_gs_a = { Solar_input_voltage_1: 0, Solar_input_voltage_2: 0, Solar_input_current_1: 0, Solar_input_current_2: 0, Solar_input_power_1: 0, Solar_input_power_2: 0, Battery_voltage: 0, Battery_capacity: 0, Battery_current: 0, AC_input_voltage_R: 0, AC_input_voltage_S: 0, AC_input_voltage_T: 0, AC_input_frequency: 0, AC_input_current_R: 0, AC_input_current_S: 0, AC_input_current_T: 0, AC_output_voltage_R: 0, AC_output_voltage_S: 0, AC_output_voltage_T: 0, AC_output_frequency: 0, Inner_temperature: 0, Component_max_temperature: 0, External_battery_temperature: 0, Alive: 99, cnt: 0, cnt_p:0 };
var value_ps_a = {Solar_input_power1: 0,Solar_input_power2: 0,AC_input_active_power_R: 0,AC_input_active_power_S: 0,AC_input_active_power_T: 0,AC_input_total_active_power: 0,AC_output_active_power_R: 0,AC_output_active_power_S: 0,AC_output_active_power_T: 0,AC_output_total_active_power: 0,AC_output_apperent_power_R: 0,AC_output_apperent_power_S: 0,AC_output_apperent_power_T: 0,AC_output_total_apperent_power: 0,AC_output_power_percentage: 0,AC_output_connect_status: 0,Solar_input_1_work_status: 0,Solar_input_2_work_status: 0,Battery_power_direction: 0,DCAC_power_direction: 0,Line_power_direction: 0,Alive: 99,cnt: 0};
var value_gs_ar = {
    Solar_input_voltage_1: [],
    Solar_input_voltage_2: [],
    Solar_input_current_1: [],
    Solar_input_current_2: [],
    Solar_input_power_1: [],
    Solar_input_power_2: [],
    Battery_voltage: [],
    Battery_capacity: [],
    Battery_current: [],
    AC_input_voltage_R: [],
    AC_input_voltage_S: [],
    AC_input_voltage_T: [],
    AC_input_frequency: [],
    AC_input_current_R: [],
    AC_input_current_S: [],
    AC_input_current_T: [],
    AC_output_voltage_R: [],
    AC_output_voltage_S: [],
    AC_output_voltage_T: [],
    AC_output_frequency: [],
    Inner_temperature: [],
    External_battery_temperature: [],
    Alive: 99,
    cnt: 0
};
var value_ps_ar = {
    Solar_input_power1: [],
    Solar_input_power2: [],
    AC_input_active_power_R: [],
    AC_input_active_power_S: [],
    AC_input_active_power_T: [],
    AC_input_total_active_power: [],
    AC_output_active_power_R: [],
    AC_output_active_power_S: [],
    AC_output_active_power_T: [],
    AC_output_total_active_power: [],
    AC_output_apperent_power_R: [],
    AC_output_apperent_power_S: [],
    AC_output_apperent_power_T: [],
    AC_output_total_apperent_power: [],
    AC_output_power_percentage: [],
    AC_output_connect_status: 0,
    Solar_input_1_work_status: 0,
    Solar_input_2_work_status: 0,
    Battery_power_direction: 0,
    DCAC_power_direction: 0,
    Line_power_direction: 0,
    Alive: 99,
    cnt: 0
};
var value_gs_q = { Solar_input_voltage_1: 0, Solar_input_voltage_2: 0, Solar_input_current_1: 0, Solar_input_current_2: 0, Solar_input_power_1: 0, Solar_input_power_2: 0, Battery_voltage: 0, Battery_capacity: 0, Battery_current: 0, AC_input_voltage_R: 0, AC_input_voltage_S: 0, AC_input_voltage_T: 0, AC_input_frequency: 0, AC_input_current_R: 0, AC_input_current_S: 0, AC_input_current_T: 0, AC_output_voltage_R: 0, AC_output_voltage_S: 0, AC_output_voltage_T: 0, AC_output_frequency: 0, Inner_temperature: 0, Component_max_temperature: 0, External_battery_temperature: 0, Alive: 99, cnt: 0, cnt_p:0 };
var value_ps_q = {Solar_input_power1: 0,Solar_input_power2: 0,AC_input_active_power_R: 0,AC_input_active_power_S: 0,AC_input_active_power_T: 0,AC_input_total_active_power: 0,AC_output_active_power_R: 0,AC_output_active_power_S: 0,AC_output_active_power_T: 0,AC_output_total_active_power: 0,AC_output_apperent_power_R: 0,AC_output_apperent_power_S: 0,AC_output_apperent_power_T: 0,AC_output_total_apperent_power: 0,AC_output_power_percentage: 0,AC_output_connect_status: 0,Solar_input_1_work_status: 0,Solar_input_2_work_status: 0,Battery_power_direction: 0,DCAC_power_direction: 0,Line_power_direction: 0,Alive: 99,cnt: 0};
//var value_gs_aq = { Solar_input_voltage_1: 0, Solar_input_voltage_2: 0, Solar_input_current_1: 0, Solar_input_current_2: 0, Solar_input_power_1: 0, Solar_input_power_2: 0, Battery_voltage: 0, Battery_capacity: 0, Battery_current: 0, AC_input_voltage_R: 0, AC_input_voltage_S: 0, AC_input_voltage_T: 0, AC_input_frequency: 0, AC_input_current_R: 0, AC_input_current_S: 0, AC_input_current_T: 0, AC_output_voltage_R: 0, AC_output_voltage_S: 0, AC_output_voltage_T: 0, AC_output_frequency: 0, Inner_temperature: 0, Component_max_temperature: 0, External_battery_temperature: 0, Alive: 99, cnt: 0, cnt_p:0 };
//var value_ps_aq = {Solar_input_power1: 0,Solar_input_power2: 0,AC_input_active_power_R: 0,AC_input_active_power_S: 0,AC_input_active_power_T: 0,AC_input_total_active_power: 0,AC_output_active_power_R: 0,AC_output_active_power_S: 0,AC_output_active_power_T: 0,AC_output_total_active_power: 0,AC_output_apperent_power_R: 0,AC_output_apperent_power_S: 0,AC_output_apperent_power_T: 0,AC_output_total_apperent_power: 0,AC_output_power_percentage: 0,AC_output_connect_status: 0,Solar_input_1_work_status: 0,Solar_input_2_work_status: 0,Battery_power_direction: 0,DCAC_power_direction: 0,Line_power_direction: 0,Alive: 99,cnt: 0};
//var value_gs_z = { Solar_input_voltage_1: 0, Solar_input_voltage_2: 0, Solar_input_current_1: 0, Solar_input_current_2: 0, Solar_input_power_1: 0, Solar_input_power_2: 0, Battery_voltage: 0, Battery_capacity: 0, Battery_current: 0, AC_input_voltage_R: 0, AC_input_voltage_S: 0, AC_input_voltage_T: 0, AC_input_frequency: 0, AC_input_current_R: 0, AC_input_current_S: 0, AC_input_current_T: 0, AC_output_voltage_R: 0, AC_output_voltage_S: 0, AC_output_voltage_T: 0, AC_output_frequency: 0, Inner_temperature: 0, Component_max_temperature: 0, External_battery_temperature: 0, Alive: 99, cnt: 0, cnt_p:0 };
//var value_ps_z = {Solar_input_power1: 0,Solar_input_power2: 0,AC_input_active_power_R: 0,AC_input_active_power_S: 0,AC_input_active_power_T: 0,AC_input_total_active_power: 0,AC_output_active_power_R: 0,AC_output_active_power_S: 0,AC_output_active_power_T: 0,AC_output_total_active_power: 0,AC_output_apperent_power_R: 0,AC_output_apperent_power_S: 0,AC_output_apperent_power_T: 0,AC_output_total_apperent_power: 0,AC_output_power_percentage: 0,AC_output_connect_status: 0,Solar_input_1_work_status: 0,Solar_input_2_work_status: 0,Battery_power_direction: 0,DCAC_power_direction: 0,Line_power_direction: 0,Alive: 99,cnt: 0};

function parser(str, type, length, rcv_count) {
    //console.log(str.slice(1, 5));
    //console.log(str);

    var strtype = str.slice(1, 5);
    var strtmp, spstr;


    if (strtype.includes('D110')) { // General Status
        strtmp = (str.slice(5));
        spstr = strtmp.split(",");
        value_gs.Solar_input_voltage_1 = spstr[0] / 10;
        value_gs.Solar_input_voltage_2 = spstr[1] / 10;
        value_gs.Solar_input_current_1 = spstr[2] / 100;
        value_gs.Solar_input_current_2 = spstr[3] / 100;
        value_gs.Solar_input_power_1 = value_gs.Solar_input_voltage_1 * value_gs.Solar_input_current_1;
        value_gs.Solar_input_power_2 = value_gs.Solar_input_voltage_2 * value_gs.Solar_input_current_2;
        value_gs.Battery_voltage = spstr[4] / 10;
        value_gs.Battery_capacity = spstr[5] * 1;
        value_gs.Battery_current = spstr[6] / 10;
        value_gs.AC_input_voltage_R = spstr[7] / 10;
        value_gs.AC_input_voltage_S = spstr[8] / 10;
        value_gs.AC_input_voltage_T = spstr[9] / 10;
        value_gs.AC_input_frequency = spstr[10] / 100;
        //value_gs.AC_input_current_R = spstr[11] / 10;
        //value_gs.AC_input_current_S = spstr[12] / 10;
        //value_gs.AC_input_current_T = spstr[13] / 10;
        value_gs.AC_output_voltage_R = spstr[14] / 10;
        value_gs.AC_output_voltage_S = spstr[15] / 10;
        value_gs.AC_output_voltage_T = spstr[16] / 10;
        value_gs.AC_output_frequency = spstr[17] / 100;
        
        value_gs.Inner_temperature = spstr[21] * 1;
        value_gs.External_battery_temperature = spstr[23] * 1;
        value_gs.Alive = 0;
        /*
        console.log(value_gs.AC_input_current_R);
        
        console.log(value_gs.AC_output_voltage_R);
        console.log(value_gs.Battery_capacity);
        */
       //console.log(value_gs);




        // 분단위 누적
        value_gs_a.Solar_input_voltage_1 += Number(value_gs.Solar_input_voltage_1);
        value_gs_a.Solar_input_voltage_2 += Number(value_gs.Solar_input_voltage_2);
        value_gs_a.Solar_input_current_1 += Number(value_gs.Solar_input_current_1);
        value_gs_a.Solar_input_current_2 += Number(value_gs.Solar_input_current_2);
        value_gs_a.Solar_input_power_1 += Number(value_gs.Solar_input_power_1);
        value_gs_a.Solar_input_power_2 += Number(value_gs.Solar_input_power_2);
        value_gs_a.Battery_voltage += Number(value_gs.Battery_voltage);
        value_gs_a.Battery_capacity += Number(value_gs.Battery_capacity);
        value_gs_a.Battery_current += Number(value_gs.Battery_current);
        value_gs_a.AC_input_voltage_R += Number(value_gs.AC_input_voltage_R);
        value_gs_a.AC_input_voltage_S += Number(value_gs.AC_input_voltage_S);
        value_gs_a.AC_input_voltage_T += Number(value_gs.AC_input_voltage_T);
        value_gs_a.AC_input_frequency += Number(value_gs.AC_input_frequency);
        //value_gs_a.AC_input_current_R += Number(value_gs.AC_input_current_R);
        //value_gs_a.AC_input_current_S += Number(value_gs.AC_input_current_S);
        //value_gs_a.AC_input_current_T += Number(value_gs.AC_input_current_T);
        value_gs_a.AC_output_voltage_R += Number(value_gs.AC_output_voltage_R);
        value_gs_a.AC_output_voltage_S += Number(value_gs.AC_output_voltage_S);
        value_gs_a.AC_output_voltage_T += Number(value_gs.AC_output_voltage_T);
        value_gs_a.AC_output_frequency += Number(value_gs.AC_output_frequency);
        
        value_gs_a.Inner_temperature += value_gs.Inner_temperature;
        value_gs_a.External_battery_temperature += value_gs.External_battery_temperature;
        value_gs_a.cnt++;
        value_gs_a.alive = 0;


        // 15분단위 배열삽입
        value_gs_ar.Solar_input_voltage_1.push(value_gs.Solar_input_voltage_1);
        value_gs_ar.Solar_input_voltage_2.push(value_gs.Solar_input_voltage_2);
        value_gs_ar.Solar_input_current_1.push(value_gs.Solar_input_current_1);
        value_gs_ar.Solar_input_current_2.push(value_gs.Solar_input_current_2);
        value_gs_ar.Solar_input_power_1.push(value_gs.Solar_input_power_1);
        value_gs_ar.Solar_input_power_2.push(value_gs.Solar_input_power_2);
        value_gs_ar.Battery_voltage.push(value_gs.Battery_voltage);
        value_gs_ar.Battery_capacity.push(value_gs.Battery_capacity);
        value_gs_ar.Battery_current.push(value_gs.Battery_current);
        value_gs_ar.AC_input_voltage_R.push(value_gs.AC_input_voltage_R);
        value_gs_ar.AC_input_voltage_S.push(value_gs.AC_input_voltage_S);
        value_gs_ar.AC_input_voltage_T.push(value_gs.AC_input_voltage_T);
        value_gs_ar.AC_input_frequency.push(value_gs.AC_input_frequency);
        value_gs_ar.AC_output_voltage_R.push(value_gs.AC_output_voltage_R);
        value_gs_ar.AC_output_voltage_S.push(value_gs.AC_output_voltage_S);
        value_gs_ar.AC_output_voltage_T.push(value_gs.AC_output_voltage_T);
        value_gs_ar.AC_output_frequency.push(value_gs.AC_output_frequency);
        value_gs_ar.Inner_temperature.push(value_gs.Inner_temperature);
        value_gs_ar.External_battery_temperature.push(value_gs.External_battery_temperature);
        value_gs_ar.cnt++;
        value_gs_ar.alive = 0;
        

        /*
        //15분단위 누적
        value_gs_aq.Solar_input_voltage_1 += value_gs.Solar_input_voltage_1;
        value_gs_aq.Solar_input_voltage_2 += value_gs.Solar_input_voltage_2;
        value_gs_aq.Solar_input_current_1 += value_gs.Solar_input_current_1;
        value_gs_aq.Solar_input_current_2 += value_gs.Solar_input_current_2;
        value_gs_aq.Solar_input_power_1 += value_gs.Solar_input_power_1;
        value_gs_aq.Solar_input_power_2 += value_gs.Solar_input_power_2;
        value_gs_aq.Battery_voltage += value_gs.Battery_voltage;
        value_gs_aq.Battery_capacity += value_gs.Battery_capacity;
        value_gs_aq.Battery_current += value_gs.Battery_current;
        value_gs_aq.AC_input_voltage_R += value_gs.AC_input_voltage_R;
        value_gs_aq.AC_input_voltage_S += value_gs.AC_input_voltage_S;
        value_gs_aq.AC_input_voltage_T += value_gs.AC_input_voltage_T;
        value_gs_aq.AC_input_frequency += value_gs.AC_input_frequency;
        //value_gs_aq.AC_input_current_R += value_gs.AC_input_current_R;
        //value_gs_aq.AC_input_current_S += value_gs.AC_input_current_S;
        //value_gs_aq.AC_input_current_T += value_gs.AC_input_current_T;
        value_gs_aq.AC_output_voltage_R += value_gs.AC_output_voltage_R;
        value_gs_aq.AC_output_voltage_S += value_gs.AC_output_voltage_S;
        value_gs_aq.AC_output_voltage_T += value_gs.AC_output_voltage_T;
        value_gs_aq.AC_output_frequency += value_gs.AC_output_frequency;
        
        value_gs_aq.Inner_temperature += value_gs.Inner_temperature;
        value_gs_aq.External_battery_temperature += value_gs.External_battery_temperature;
        value_gs_aq.cnt++;
        value_gs_aq.alive = 0;

        */
        //console.log(value_gs);
        //console.log("태양광 volt = " + value_gs.Solar_input_voltage_1 + "/amp = " + value_gs.Solar_input_current_1 + " /watt = " + value_gs.Solar_input_power_1);
        //console.log(str);
    } 
    else if (strtype.includes('D101')) { // General Status
        strtmp = (str.slice(5));
        spstr = strtmp.split(",");

        //console.log(strtmp);
        //console.log(spstr);
        
        value_ps.Solar_input_power1 = spstr[0];
        value_ps.Solar_input_power2 = spstr[1];


        value_ps.AC_input_active_power_R = spstr[3];
        value_ps.AC_input_active_power_S = spstr[4];
        value_ps.AC_input_active_power_T = spstr[5];
        value_ps.AC_input_total_active_power = spstr[6];
        value_ps.AC_output_active_power_R = spstr[7];
        value_ps.AC_output_active_power_S = spstr[8];
        value_ps.AC_output_active_power_T = spstr[9];
        value_ps.AC_output_total_active_power = spstr[10];
        value_ps.AC_output_apperent_power_R = spstr[11];
        value_ps.AC_output_apperent_power_S = spstr[12];
        value_ps.AC_output_apperent_power_T = spstr[13];
        value_ps.AC_output_total_apperent_power = spstr[14];
        value_ps.AC_output_power_percentage = spstr[15];
        value_ps.AC_output_connect_status = spstr[16];
        value_ps.Solar_input_1_work_status = spstr[17];
        value_ps.Solar_input_2_work_status = spstr[18];
        value_ps.Battery_power_direction = spstr[19];
        value_ps.DCAC_power_direction = spstr[20];
        value_ps.Line_power_direction = spstr[21];
        value_ps.Alive = 0;
        value_ps.cnt++;

        
        // 분단위 누적
        value_ps_a.Solar_input_power1 += Number(value_ps.Solar_input_power1);
        value_ps_a.Solar_input_power2 += Number(value_ps.Solar_input_power2);
        value_ps_a.AC_input_active_power_R += Number(value_ps.AC_input_active_power_R);
        value_ps_a.AC_input_active_power_S += Number(value_ps.AC_input_active_power_S);
        value_ps_a.AC_input_active_power_T += Number(value_ps.AC_input_active_power_T);
        value_ps_a.AC_input_total_active_power += Number(value_ps.AC_input_total_active_power);
        value_ps_a.AC_output_active_power_R += Number(value_ps.AC_output_active_power_R);
        value_ps_a.AC_output_active_power_S += Number(value_ps.AC_output_active_power_S);
        value_ps_a.AC_output_active_power_T += Number(value_ps.AC_output_active_power_T);
        value_ps_a.AC_output_total_active_power += Number(value_ps.AC_output_total_active_power);
        value_ps_a.AC_output_apperent_power_R += Number(value_ps.AC_output_apperent_power_R);
        value_ps_a.AC_output_apperent_power_S += Number(value_ps.AC_output_apperent_power_S);
        value_ps_a.AC_output_apperent_power_T += Number(value_ps.AC_output_apperent_power_T);
        value_ps_a.AC_output_total_apperent_power += Number(value_ps.AC_output_total_apperent_power);
        value_ps_a.AC_output_power_percentage += Number(value_ps.AC_output_power_percentage);
        // 아래는 누적필요 없음
        value_ps_a.AC_output_connect_status = value_ps.AC_output_connect_status;
        value_ps_a.Solar_input_1_work_status = value_ps.Solar_input_1_work_status;
        value_ps_a.Solar_input_2_work_status = value_ps.Solar_input_2_work_status;
        value_ps_a.Battery_power_direction = value_ps.Battery_power_direction;
        value_ps_a.DCAC_power_direction = value_ps.DCAC_power_direction;
        value_ps_a.Line_power_direction = value_ps.Line_power_direction;
        value_ps_a.cnt++;

        //15분단위 배열삽입
        value_ps_ar.Solar_input_power1.push(Number(value_ps.Solar_input_power1));
        value_ps_ar.Solar_input_power2.push(Number(value_ps.Solar_input_power2));
        value_ps_ar.AC_input_active_power_R.push(Number(value_ps.AC_input_active_power_R));
        value_ps_ar.AC_input_active_power_S.push(Number(value_ps.AC_input_active_power_S));
        value_ps_ar.AC_input_active_power_T.push(Number(value_ps.AC_input_active_power_T));
        value_ps_ar.AC_input_total_active_power.push(Number(value_ps.AC_input_total_active_power));
        value_ps_ar.AC_output_active_power_R.push(Number(value_ps.AC_output_active_power_R));
        value_ps_ar.AC_output_active_power_S.push(Number(value_ps.AC_output_active_power_S));
        value_ps_ar.AC_output_active_power_T.push(Number(value_ps.AC_output_active_power_T));
        value_ps_ar.AC_output_total_active_power.push(Number(value_ps.AC_output_total_active_power));
        value_ps_ar.AC_output_apperent_power_R.push(Number(value_ps.AC_output_apperent_power_R));
        value_ps_ar.AC_output_apperent_power_S.push(Number(value_ps.AC_output_apperent_power_S));
        value_ps_ar.AC_output_apperent_power_T.push(Number(value_ps.AC_output_apperent_power_T));
        value_ps_ar.AC_output_total_apperent_power.push(Number(value_ps.AC_output_total_apperent_power));
        value_ps_ar.AC_output_power_percentage.push(Number(value_ps.AC_output_power_percentage));
        // 아래는 누적필요 없음
        value_ps_ar.AC_output_connect_status = value_ps.AC_output_connect_status;
        value_ps_ar.Solar_input_1_work_status = value_ps.Solar_input_1_work_status;
        value_ps_ar.Solar_input_2_work_status = value_ps.Solar_input_2_work_status;
        value_ps_ar.Battery_power_direction = value_ps.Battery_power_direction;
        value_ps_ar.DCAC_power_direction = value_ps.DCAC_power_direction;
        value_ps_ar.Line_power_direction = value_ps.Line_power_direction;
        value_ps_ar.cnt++;
        value_ps_ar.Alive++;

        
        /*
        //15분단위 누적
        value_ps_aq.Solar_input_power1 += Number(value_ps.Solar_input_power1);
        value_ps_aq.Solar_input_power2 += Number(value_ps.Solar_input_power2);
        value_ps_aq.AC_input_active_power_R += Number(value_ps.AC_input_active_power_R);
        value_ps_aq.AC_input_active_power_S += Number(value_ps.AC_input_active_power_S);
        value_ps_aq.AC_input_active_power_T += Number(value_ps.AC_input_active_power_T);
        value_ps_aq.AC_input_total_active_power += Number(value_ps.AC_input_total_active_power);
        value_ps_aq.AC_output_active_power_R += Number(value_ps.AC_output_active_power_R);
        value_ps_aq.AC_output_active_power_S += Number(value_ps.AC_output_active_power_S);
        value_ps_aq.AC_output_active_power_T += Number(value_ps.AC_output_active_power_T);
        value_ps_aq.AC_output_total_active_power += Number(value_ps.AC_output_total_active_power);
        value_ps_aq.AC_output_apperent_power_R += Number(value_ps.AC_output_apperent_power_R);
        value_ps_aq.AC_output_apperent_power_S += Number(value_ps.AC_output_apperent_power_S);
        value_ps_aq.AC_output_apperent_power_T += Number(value_ps.AC_output_apperent_power_T);
        value_ps_aq.AC_output_total_apperent_power += Number(value_ps.AC_output_total_apperent_power);
        value_ps_aq.AC_output_power_percentage += Number(value_ps.AC_output_power_percentage);
        // 아래는 누적필요 없음
        value_ps_aq.AC_output_connect_status = value_ps.AC_output_connect_status;
        value_ps_aq.Solar_input_1_work_status = value_ps.Solar_input_1_work_status;
        value_ps_aq.Solar_input_2_work_status = value_ps.Solar_input_2_work_status;
        value_ps_aq.Battery_power_direction = value_ps.Battery_power_direction;
        value_ps_aq.DCAC_power_direction = value_ps.DCAC_power_direction;
        value_ps_aq.Line_power_direction = value_ps.Line_power_direction;
        value_ps_aq.cnt++;
        */

        /*
        
        //분단위 누적
        value_gs_a.AC_input_current_R += value_gs.AC_input_current_R;
        value_gs_a.AC_input_current_S += value_gs.AC_input_current_S;
        value_gs_a.AC_input_current_T += value_gs.AC_input_current_T;
        value_gs_a.AC_output_current_S += value_gs.AC_output_current_S;
        value_gs_a.AC_output_current_T += value_gs.AC_output_current_T;
        value_gs_a.cnt_p++;

        //15분단위 누적
        value_gs_aq.AC_input_current_R += value_gs.AC_input_current_R;
        value_gs_aq.AC_input_current_S += value_gs.AC_input_current_S;
        value_gs_aq.AC_input_current_T += value_gs.AC_input_current_T;
                value_gs_aq.AC_output_current_S += value_gs.AC_output_current_S;
        value_gs_aq.AC_output_current_T += value_gs.AC_output_current_T;
        value_gs_aq.cnt_p++;
        */
        

        //console.log(value_ps);
    } else {
        console.log(str);
    }
}




function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
}


function btoh(fr) {
    return ('00' + fr.toString(16)).slice(-2).toUpperCase();
}

function tof(num) {
    return Number(num.toFixed(1));
}


function sint(tmp) { // signed int 형태로 들어온 2byte binaly data를 signed로 변형한다.
    return tmp > 0x7FFF ? tmp - 65536 : tmp;
}

/////////////////////////////////////////////////

var moderun;

function mode_charge(pwr) {
    var date = new Date();
    if (moderun != 0 || run.mode != 'charge') {
        moderun = 0;
        run.mode = 'charge';
        console.log(date + "MODE Charge!");
        /*
        port.write("^S005EDA1\r");
        port.write("^S005EDB1\r");
        //port.write("^S005EDC1\r");
        port.write("^S005EDD1\r");
        port.write("^S005EDE1\r");
        port.write("^S005EDF1\r");
        port.write("^S005EDG1\r");
        port.write("^S005EDH1\r");
        */
        port_opti.write("^S005EDA1\r"); // 배터리 충전 허용
        port_opti.write("^S005EDB1\r"); // 배터리 AC충전 허용
        //port.write("^S005EDC1\r"); // 공공망에 파워 공급 허용 X
        port_opti.write("^S005EDD1\r"); // 태양광 입력이 정상일때 부하로 배터리 방전을 허용.
        port_opti.write("^S005EDE1\r"); // 태양광 입력이 없을때 배터리 방전을 허용.
        port_opti.write("^S005EDF1\r"); // 태양광 입력이 정상일때 공공망으로 배터리 방전 X
        port_opti.write("^S005EDG1\r"); // 태양광 입력이 없을때 공공망으로 배터리 방전 X
        port_opti.write("^S005EDH1\r"); // 공급파워에 따라 PF 자동 조절 비활성화(sp10K만 있음)

    }
    if (pwr) {
        //var snd = "^S010MCHGC" + zerofil4(parseInt(pwr / 50 * 10)) + "\r"; // Set battery maximum charge current
        //port.write(snd);
        //var snd = "^S010MCHGC1900\r"; // Set battery maximum charge current
        if (pwr > 7500) pwr = 7500;
        var snd = "^S010MCHGC1500\r"; // Set battery maximum charge current
        port_opti.write(snd);
        snd = "^S011MUCHGC" + zerofil4(parseInt(pwr / 54 * 10)) + "\r"; //Max. AC charging current from AC
        port_opti.write(snd);
        console.log(date + "charge amp change : " + snd);
        //client.write("^S010MCHGC1000\r");   // Set battery maximum charge current / 0.1a단위
    }
}

function mode_discharge(pwr) {
    var date = new Date();
    if (moderun != 1 || run.mode != 'discharge') {
        moderun = 1;
        run.mode = 'discharge';
        console.log("Discharge MODE!");
        //port.write("S011GPMP007500\r");
        port_opti.write("^S005EDA0\r");
        port_opti.write("^S005EDB0\r");
        ///port.write("^S005EDC1\r");
        port_opti.write("^S005EDD1\r");
        port_opti.write("^S005EDE1\r");
        port_opti.write("^S005EDF1\r");
        port_opti.write("^S005EDG1\r");
        port_opti.write("^S005EDH1\r");
    }
    if (pwr) {
        if (pwr > 7500) pwr = 7500;
        var snd = "^S011GPMP" + zerofil6(parseInt(pwr)) + "\r"; // Set max power of feeding grid
        port_opti.write(snd);
        //console.log(date + "discharge pwr change : " + snd);
    } else
        port_opti.write("S011GPMP007500\r");

}

function mode_idle() {
    if (moderun != 2 || run.mode != 'idle') {
        moderun = 2;
        run.mode = 'idle';
        console.log("IDLE MODE");
        port_opti.write("^S005EDA1\r");
        port_opti.write("^S005EDB0\r");
        //port.write("^S005EDC1\r");
        port_opti.write("^S005EDD0\r");
        port_opti.write("^S005EDE0\r");
        port_opti.write("^S005EDF0\r");
        port_opti.write("^S005EDG0\r");
        port_opti.write("^S005EDH0\r");
    }
}


// http://192.168.0.134/send_opti?ins=^P005PIRI 이런식으로 수동 명령어를 보내볼 수 있다. 아주 여러번 보내봐야 결과값이 보일 수 있다.
app.get("/send_opti", function(req, res) {
    var ins = req.query.ins;
    console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + "send_opti " + "ins = " + ins);
    port_opti.write(ins + "\r");
    res.json('ok');
});



function send_opti_with_crc(sendstr) {
    var chk = checksum(sendstr).toString();
    chk = zerofil(chk);
    sendstr += chk;
    console.log(sendstr);
    port_opti.write(sendstr + "\r");
}

// create an empty modbus client 
var ModbusRTU = require("modbus-serial");
const { min } = require('moment');
//var client_modbus_grid = new ModbusRTU();

// open connection to a serial port 
//client_modbus_grid.connectRTUBuffered(set.port_pm_grid, { baudRate: 38400 });
//client_modbus_grid.setID(1);

var client_modbus_battery = new ModbusRTU();
//client_modbus_battery.connectRTUBuffered(set.port_batt, { baudRate: 115200 });
//client_modbus_battery.setID(1);


var value_mb = { ph1_volt: 0, ph2_volt: 0, ph3_volt: 0, ph1_current: 0, ph2_current: 0, ph3_current: 0, ph1_power: 0, ph2_power: 0, ph3_power: 0, ph1_powerVA: 0, ph2_powerVA: 0, ph3_powerVA: 0, ph1_amp_reactive: 0, ph2_amp_reactive: 0, ph3_amp_reactive: 0, ph1_pf: 0, ph2_pf: 0, ph3_pf: 0, Alive: 99, cnt: 0 };
var value_mb_a = { ph1_volt: 0, ph2_volt: 0, ph3_volt: 0, ph1_current: 0, ph2_current: 0, ph3_current: 0, ph1_power: 0, ph2_power: 0, ph3_power: 0, ph1_powerVA: 0, ph2_powerVA: 0, ph3_powerVA: 0, ph1_amp_reactive: 0, ph2_amp_reactive: 0, ph3_amp_reactive: 0, ph1_pf: 0, ph2_pf: 0, ph3_pf: 0, Alive: 99, cnt: 0 };
var value_mb_z = { ph1_volt: 0, ph2_volt: 0, ph3_volt: 0, ph1_current: 0, ph2_current: 0, ph3_current: 0, ph1_power: 0, ph2_power: 0, ph3_power: 0, ph1_powerVA: 0, ph2_powerVA: 0, ph3_powerVA: 0, ph1_amp_reactive: 0, ph2_amp_reactive: 0, ph3_amp_reactive: 0, ph1_pf: 0, ph2_pf: 0, ph3_pf: 0, Alive: 99, cnt: 0 };

var value_mb_aq = { ph1_volt: 0, ph2_volt: 0, ph3_volt: 0, ph1_current: 0, ph2_current: 0, ph3_current: 0, ph1_power: 0, ph2_power: 0, ph3_power: 0, ph1_powerVA: 0, ph2_powerVA: 0, ph3_powerVA: 0, ph1_amp_reactive: 0, ph2_amp_reactive: 0, ph3_amp_reactive: 0, ph1_pf: 0, ph2_pf: 0, ph3_pf: 0, Alive: 99, cnt: 0 };
var value_mb_q = { ph1_volt: 0, ph2_volt: 0, ph3_volt: 0, ph1_current: 0, ph2_current: 0, ph3_current: 0, ph1_power: 0, ph2_power: 0, ph3_power: 0, ph1_powerVA: 0, ph2_powerVA: 0, ph3_powerVA: 0, ph1_amp_reactive: 0, ph2_amp_reactive: 0, ph3_amp_reactive: 0, ph1_pf: 0, ph2_pf: 0, ph3_pf: 0, Alive: 99, cnt: 0 };

var tick = 0;

// send_opti 0.5초 간격
setInterval(function() {
    try {
        //console.log("Query General Status!");
        if (tick == 0) {
            port_opti.write("^P003GS\r");
            //process.stdout.write('0');
            tick = 1;
        } else {
            port_opti.write("^P003PS\r");
            //process.stdout.write('1');
            tick = 0;
        }
		return; //modbus exit
        
    } catch (err) {
        console.log(err);
    }
}, 500);

var time_out = 50;
// 타임아웃 처리 및 DB업데이트 수행
setInterval(function() {
    try {
        //process.stdout.write("+"); 
        // timeout 계산용 증가
        value_gs.Alive++;
        value_gs_ar.Alive++;
        value_ps.Alive++;
        value_ps_ar.Alive++;
        res_kwhq.alive++;
        // overflow 방지용
        if (value_gs.Alive > 1000) value_gs.Alive = 1000;
        if (value_ps.Alive > 1000) value_ps.Alive = 1000;
        if (value_gs_ar.Alive > 1000) value_gs_ar.Alive = 1000;
        if (value_ps_ar.Alive > 1000) value_ps_ar.Alive = 1000;
        if (res_kwhq.alive > 1000) res_kwhq.alive = 1000;

    } catch (err) {
        console.log(err);
    }
}, 100);


var dbsum_hour = new Date().getHours();
var dbsum_minute = new Date().getMinutes();
var dbsum_day = new Date().getDate();
var dbsum_month = new Date().getMonth();
var update_hour = false;
var update_day = false;

// 1초 마다 db update 및 1분단위 데이터 처리
setInterval(function() {
    try {
        //process.stdout.write("U");

        // 현재 minute가 변경되었다면?
        if (dbsum_minute != new Date().getMinutes()) {
            dbsum_minute = new Date().getMinutes(); //분 갱신

            //15분단위
            if (dbsum_minute % 15 == 0) {
                var tq = {
                    d: new Date(),
                    Solar_input_voltage_1: 0,
                    Solar_input_power_1: 0,
                    Solar_input_voltage_2: 0,
                    Solar_input_power_2: 0,
                    Battery_voltage: 0,
                    Battery_capacity: 0,
                    Battery_current: 0,
                    Inner_temperature: 0,
                    External_battery_temperature: 0,
                    ph1_volt: 0,
                    ph2_volt: 0,
                    ph3_volt: 0,
                    ph1_current: 0,
                    ph2_current: 0,
                    ph3_current: 0,
                    ph1_power: 0,
                    ph2_power: 0,
                    ph3_power: 0,
                    ph1_powerVA: 0,
                    ph2_powerVA: 0,
                    ph3_powerVA: 0,
                    ph1_load: 0,
                    ph2_load: 0,
                    ph3_load: 0,
                    ph1_amp_reactive: 0,
                    ph2_amp_reactive: 0,
                    ph3_amp_reactive: 0,
                    ph1_pf: 0,
                    ph2_pf: 0,
                    ph3_pf: 0,
                    update_opti: false,
                    update_pwmt: false,
                    t1: 0,
                    t2: 0,
                    qr: 0
                };

                var d = new Date();
                //var index = d.getHours() * 4 + parseInt(d.getMinutes() / 15);
                var index = d.getHours() * 60 + d.getMinutes();
                /*
                // optisolar gs 15분 평균을 낸다.
                if (value_gs_aq.cnt > 0) {
                    value_gs_q.Alive = 0;

                    value_gs_q.Solar_input_voltage_1 = value_gs_aq.Solar_input_voltage_1 / value_gs_aq.cnt;
                    value_gs_q.Solar_input_voltage_2 = value_gs_aq.Solar_input_voltage_2 / value_gs_aq.cnt;
                    value_gs_q.Solar_input_current_1 = value_gs_aq.Solar_input_current_1 / value_gs_aq.cnt;
                    value_gs_q.Solar_input_current_2 = value_gs_aq.Solar_input_current_2 / value_gs_aq.cnt;
                    value_gs_q.Solar_input_power_1 = value_gs_aq.Solar_input_power_1 / value_gs_aq.cnt;
                    value_gs_q.Solar_input_power_2 = value_gs_aq.Solar_input_power_2 / value_gs_aq.cnt;
                    value_gs_q.Battery_voltage = value_gs_aq.Battery_voltage / value_gs_aq.cnt;
                    value_gs_q.Battery_capacity = tofn(SOC_Now, 3);
                    value_gs_q.Battery_current = value_gs_aq.Battery_current / value_gs_aq.cnt;
                    value_gs_q.AC_input_voltage_R = value_gs_aq.AC_input_voltage_R / value_gs_aq.cnt;
                    value_gs_q.AC_input_voltage_S = value_gs_aq.AC_input_voltage_S / value_gs_aq.cnt;
                    value_gs_q.AC_input_voltage_T = value_gs_aq.AC_input_voltage_T / value_gs_aq.cnt;
                    value_gs_q.AC_input_frequency = value_gs_aq.AC_input_frequency / value_gs_aq.cnt;
                    value_gs_q.AC_input_current_R = value_gs_aq.AC_input_current_R / value_gs_aq.cnt_p;
                    value_gs_q.AC_input_current_S = value_gs_aq.AC_input_current_S / value_gs_aq.cnt_p;
                    value_gs_q.AC_input_current_T = value_gs_aq.AC_input_current_T / value_gs_aq.cnt_p;
                    value_gs_q.AC_output_voltage_R = value_gs_aq.AC_output_voltage_R / value_gs_aq.cnt;
                    value_gs_q.AC_output_voltage_S = value_gs_aq.AC_output_voltage_S / value_gs_aq.cnt;
                    value_gs_q.AC_output_voltage_T = value_gs_aq.AC_output_voltage_T / value_gs_aq.cnt;
                    value_gs_q.AC_output_frequency = value_gs_aq.AC_output_frequency / value_gs_aq.cnt;
                    
                    value_gs_q.Inner_temperature = value_gs_aq.Inner_temperature / value_gs_aq.cnt;
                    value_gs_q.Component_max_temperature = value_gs_aq.Component_max_temperature / value_gs_aq.cnt;
                    value_gs_q.External_battery_temperature = value_gs_aq.External_battery_temperature / value_gs_aq.cnt;



                    //console.log(value_gs_aq.cnt + "개의 gs데이터가 모였다. 아래의 값이다.");
                    //console.log(value_gs_q);
                    value_gs_aq = cloneobj(value_gs_z);

                    // 분단위 DB에 넣을 Temp값을 미리 넣어둔다.
                    tq.Solar_input_voltage_1 = value_gs_q.Solar_input_voltage_1;
                    tq.Solar_input_power_1 = value_gs_q.Solar_input_power_1;
                    tq.Solar_input_voltage_2 = value_gs_q.Solar_input_voltage_2;
                    tq.Solar_input_power_2 = value_gs_q.Solar_input_power_2;
                    tq.Battery_voltage = value_gs_q.Battery_voltage;
                    tq.Battery_capacity = tofn(SOC_Now, 3); //value_gs_q.Battery_capacity;
                    tq.Battery_current = value_gs_q.Battery_current;
                    tq.Inner_temperature = value_gs_q.Inner_temperature;
                    tq.External_battery_temperature = value_gs_q.External_battery_temperature;
                    tq.update_opti = true;
                } else {
                    console.log("opti_gs에서 데이터를 수신하지 못했다.");
                }
                */

                if(value_gs_ar.cnt > 0) {
                    value_gs_q.Solar_input_voltage_1 = value_gs_ar.Solar_input_voltage_1.average();
                    value_gs_q.Solar_input_voltage_2 = value_gs_ar.Solar_input_voltage_2.average();
                    value_gs_q.Solar_input_current_1 = value_gs_ar.Solar_input_current_1.average();
                    value_gs_q.Solar_input_current_2 = value_gs_ar.Solar_input_current_2.average();
                    value_gs_q.Solar_input_power_1 = value_gs_ar.Solar_input_power_1.average();
                    value_gs_q.Solar_input_power_2 = value_gs_ar.Solar_input_power_2.average();
                    value_gs_q.Battery_voltage = value_gs_ar.Battery_voltage.average();
                    value_gs_q.Battery_capacity = tofn(SOC_Now, 3);
                    value_gs_q.Battery_current = value_gs_ar.Battery_current.average();
                    value_gs_q.AC_input_voltage_R = value_gs_ar.AC_input_voltage_R.average();
                    value_gs_q.AC_input_voltage_S = value_gs_ar.AC_input_voltage_S.average();
                    value_gs_q.AC_input_voltage_T = value_gs_ar.AC_input_voltage_T.average();
                    value_gs_q.AC_input_frequency = value_gs_ar.AC_input_frequency.average();
                    value_gs_q.AC_input_current_R = value_gs_ar.AC_input_current_R.average();
                    value_gs_q.AC_input_current_S = value_gs_ar.AC_input_current_S.average();
                    value_gs_q.AC_input_current_T = value_gs_ar.AC_input_current_T.average();
                    value_gs_q.AC_output_voltage_R = value_gs_ar.AC_output_voltage_R.average();
                    value_gs_q.AC_output_voltage_S = value_gs_ar.AC_output_voltage_S.average();
                    value_gs_q.AC_output_voltage_T = value_gs_ar.AC_output_voltage_T.average();
                    value_gs_q.AC_output_frequency = value_gs_ar.AC_output_frequency.average();
                    value_gs_q.Inner_temperature = value_gs_ar.Inner_temperature.average();

                    // 분단위 DB에 넣을 Temp값을 미리 넣어둔다.
                    tq.Solar_input_voltage_1 = value_gs_q.Solar_input_voltage_1;
                    tq.Solar_input_power_1 = value_gs_q.Solar_input_power_1;
                    tq.Solar_input_voltage_2 = value_gs_q.Solar_input_voltage_2;
                    tq.Solar_input_power_2 = value_gs_q.Solar_input_power_2;
                    tq.Battery_voltage = value_gs_q.Battery_voltage;
                    tq.Battery_capacity = tofn(SOC_Now, 3); //value_gs_q.Battery_capacity;
                    tq.Battery_current = value_gs_q.Battery_current;
                    tq.Inner_temperature = value_gs_q.Inner_temperature;
                    tq.External_battery_temperature = value_gs_q.External_battery_temperature;
                    tq.update_opti = true;
                }else {
                    console.log("opti_gs에서 데이터를 수신하지 못했다.");
                }
                value_gs_ar = {Solar_input_voltage_1: [],Solar_input_voltage_2: [],Solar_input_current_1: [],Solar_input_current_2: [],Solar_input_power_1: [],Solar_input_power_2: [],Battery_voltage: [],Battery_capacity: [],Battery_current: [],AC_input_voltage_R: [],AC_input_voltage_S: [],AC_input_voltage_T: [],AC_input_frequency: [],AC_input_current_R: [],AC_input_current_S: [],AC_input_current_T: [],AC_output_voltage_R: [],AC_output_voltage_S: [],AC_output_voltage_T: [],AC_output_frequency: [],Inner_temperature: [],External_battery_temperature: [],Alive: 99,cnt: 0};

                // optisolar ps 15분 평균을 낸다.
                /*
                if (value_ps_aq.cnt > 0) {
                    value_ps_q.Alive = 0;

                    value_ps_q.Solar_input_power1 = value_ps_aq.Solar_input_power1 / value_ps_aq.cnt;
                    value_ps_q.Solar_input_power2 = value_ps_aq.Solar_input_power2 / value_ps_aq.cnt;
                    value_ps_q.AC_input_active_power_R = value_ps_aq.AC_input_active_power_R / value_ps_aq.cnt;
                    value_ps_q.AC_input_active_power_S = value_ps_aq.AC_input_active_power_S / value_ps_aq.cnt;
                    value_ps_q.AC_input_active_power_T = value_ps_aq.AC_input_active_power_T / value_ps_aq.cnt;
                    value_ps_q.AC_input_total_active_power = value_ps_aq.AC_input_total_active_power / value_ps_aq.cnt;
                    value_ps_q.AC_output_active_power_R = value_ps_aq.AC_output_active_power_R / value_ps_aq.cnt;
                    value_ps_q.AC_output_active_power_S = value_ps_aq.AC_output_active_power_S / value_ps_aq.cnt;
                    value_ps_q.AC_output_active_power_T = value_ps_aq.AC_output_active_power_T / value_ps_aq.cnt;
                    value_ps_q.AC_output_total_active_power = value_ps_aq.AC_output_total_active_power / value_ps_aq.cnt;
                    value_ps_q.AC_output_apperent_power_R = value_ps_aq.AC_output_apperent_power_R / value_ps_aq.cnt;
                    value_ps_q.AC_output_apperent_power_S = value_ps_aq.AC_output_apperent_power_S / value_ps_aq.cnt;
                    value_ps_q.AC_output_apperent_power_T = value_ps_aq.AC_output_apperent_power_T / value_ps_aq.cnt;
                    value_ps_q.AC_output_total_apperent_power = value_ps_aq.AC_output_total_apperent_power / value_ps_aq.cnt;
                    value_ps_q.AC_output_power_percentage = value_ps_aq.AC_output_power_percentage / value_ps_aq.cnt;
                    value_ps_q.AC_output_connect_status = value_ps_aq.AC_output_connect_status;
                    value_ps_q.Solar_input_1_work_status = value_ps_aq.Solar_input_1_work_status;
                    value_ps_q.Solar_input_2_work_status = value_ps_aq.Solar_input_2_work_status;
                    value_ps_q.Battery_power_direction = value_ps_aq.Battery_power_direction;
                    value_ps_q.DCAC_power_direction = value_ps_aq.DCAC_power_direction;
                    value_ps_q.Line_power_direction = value_ps_aq.Line_power_direction;
                    value_ps_q.Alive = 0;
                    value_ps_q.cnt = 0;
                    //console.log(value_ps_aq.cnt + "개의 ps데이터가 모였다. 아래의 값이다.");
                    //console.log(value_ps_q);
                    value_ps_aq = cloneobj(value_ps_z);
                } else {
                    console.log("opti_ps에서 데이터를 수신하지 못했다.");
                }
                */

                if (value_ps_ar.cnt > 0) {
                    value_ps_q.Alive = 0;

                    value_ps_q.Solar_input_power1 = value_ps_ar.Solar_input_power1.average();
                    value_ps_q.Solar_input_power2 = value_ps_ar.Solar_input_power2.average();
                    value_ps_q.AC_input_active_power_R = value_ps_ar.AC_input_active_power_R.average();
                    value_ps_q.AC_input_active_power_S = value_ps_ar.AC_input_active_power_S.average();
                    value_ps_q.AC_input_active_power_T = value_ps_ar.AC_input_active_power_T.average();
                    value_ps_q.AC_input_total_active_power = value_ps_ar.AC_input_total_active_power.average();
                    value_ps_q.AC_output_active_power_R = value_ps_ar.AC_output_active_power_R.average();
                    value_ps_q.AC_output_active_power_S = value_ps_ar.AC_output_active_power_S.average();
                    value_ps_q.AC_output_active_power_T = value_ps_ar.AC_output_active_power_T.average();
                    value_ps_q.AC_output_total_active_power = value_ps_ar.AC_output_total_active_power.average();
                    value_ps_q.AC_output_apperent_power_R = value_ps_ar.AC_output_apperent_power_R.average();
                    value_ps_q.AC_output_apperent_power_S = value_ps_ar.AC_output_apperent_power_S.average();
                    value_ps_q.AC_output_apperent_power_T = value_ps_ar.AC_output_apperent_power_T.average();
                    value_ps_q.AC_output_total_apperent_power = value_ps_ar.AC_output_total_apperent_power.average();
                    value_ps_q.AC_output_power_percentage = value_ps_ar.AC_output_power_percentage.average();
                    value_ps_q.AC_output_connect_status = value_ps_ar.AC_output_connect_status;
                    value_ps_q.Solar_input_1_work_status = value_ps_ar.Solar_input_1_work_status;
                    value_ps_q.Solar_input_2_work_status = value_ps_ar.Solar_input_2_work_status;
                    value_ps_q.Battery_power_direction = value_ps_ar.Battery_power_direction;
                    value_ps_q.DCAC_power_direction = value_ps_ar.DCAC_power_direction;
                    value_ps_q.Line_power_direction = value_ps_ar.Line_power_direction;
                    value_ps_q.Alive = 0;
                    value_ps_q.cnt = 0;
                 } else {
                    console.log("opti_ps에서 데이터를 수신하지 못했다.");
                }
                //console.log(value_ps_q);
                value_ps_ar = {Solar_input_power1: [],Solar_input_power2: [],AC_input_active_power_R: [],AC_input_active_power_S: [],AC_input_active_power_T: [],AC_input_total_active_power: [],AC_output_active_power_R: [],AC_output_active_power_S: [],AC_output_active_power_T: [],AC_output_total_active_power: [],AC_output_apperent_power_R: [],AC_output_apperent_power_S: [],AC_output_apperent_power_T: [],AC_output_total_apperent_power: [],AC_output_power_percentage: [],AC_output_connect_status: 0,Solar_input_1_work_status: 0,Solar_input_2_work_status: 0,Battery_power_direction: 0,DCAC_power_direction: 0,Line_power_direction: 0,Alive: 99,cnt: 0}
                // modbus 파워메터 분 평균을 낸다.
                
                tq.ph1_volt = value_gs_q.AC_input_voltage_R;
                tq.ph2_volt = value_gs_q.AC_input_voltage_S;
                tq.ph3_volt = value_gs_q.AC_input_voltage_T;
                if(tq.ph1_volt > 0) tq.ph1_current = value_ps_q.AC_output_apperent_power_R / tq.ph1_volt;
                else tq.ph1_current = 0;
                if(tq.ph2_volt > 0) tq.ph2_current = value_ps_q.AC_output_apperent_power_S / tq.ph2_volt;
                else tq.ph2_current = 0;
                if(tq.ph3_volt > 0) tq.ph3_current = value_ps_q.AC_output_apperent_power_T / tq.ph3_volt;
                else tq.ph3_current = 0;
                tq.ph1_power = value_ps_q.AC_input_active_power_R;
                tq.ph2_power = value_ps_q.AC_input_active_power_S;
                tq.ph3_power = value_ps_q.AC_input_active_power_T;
                tq.ph1_load = value_ps_q.AC_output_active_power_R;
                tq.ph2_load = value_ps_q.AC_output_active_power_S;
                tq.ph3_load = value_ps_q.AC_output_active_power_T;
                tq.ph1_powerVA = value_ps_q.AC_output_apperent_power_R;
                tq.ph2_powerVA = value_ps_q.AC_output_apperent_power_S;
                tq.ph3_powerVA = value_ps_q.AC_output_apperent_power_T;
                tq.ph1_amp_reactive = 0;
                tq.ph2_amp_reactive = 0;
                tq.ph3_amp_reactive = 0;
                if(value_ps_q.AC_output_apperent_power_R > 0) tq.ph1_pf = value_ps_q.AC_output_active_power_R / value_ps_q.AC_output_apperent_power_R;
                else tq.ph1_pf = 0;

                if(value_ps_q.AC_output_apperent_power_S > 0) tq.ph2_pf = value_ps_q.AC_output_active_power_S / value_ps_q.AC_output_apperent_power_S;
                else tq.ph2_pf = 0;

                if(value_ps_q.AC_output_apperent_power_T > 0) tq.ph3_pf = value_ps_q.AC_output_active_power_T / value_ps_q.AC_output_apperent_power_T;
                else tq.ph3_pf = 0;
                
                tq.update_pwmt = true;

                if (tq.update_pwmt == true || tq.update_opti == true) {
                    tq.update_pwmt = false;
                    tq.update_opti = false;
                    var bat_pwr = tq.Battery_voltage * tq.Battery_current;
                    var ph1load = value_ps_q.AC_output_active_power_R; //tq.ph1_power + (tq.Solar_input_power_1 / 3) - (bat_pwr / 3);
                    var ph2load = value_ps_q.AC_output_active_power_S;//tq.ph2_power + (tq.Solar_input_power_1 / 3) - (bat_pwr / 3);
                    var ph3load = value_ps_q.AC_output_active_power_T;//tq.ph3_power + (tq.Solar_input_power_1 / 3) - (bat_pwr / 3);
                    tq.t1 = moment(); // 조회할 테이블 시작 시간
                    var db_save = {
                        index: index,
                        Time: tq.t1.toISOString(),
                        datetime: new Date(tq.t1.toISOString()),
                        Solar_input_voltage_1: Number((tq.Solar_input_voltage_1).toFixed(2)),
                        Solar_input_power_1: Number((tq.Solar_input_power_1).toFixed(2)),
                        Solar_input_voltage_2: Number((tq.Solar_input_voltage_2).toFixed(2)),
                        Solar_input_power_2: Number((tq.Solar_input_power_2).toFixed(2)),
                        Battery_voltage: Number(tq.Battery_voltage.toFixed(2)),

                        Battery_capacity: tofn(SOC_Now, 3), //Number(tq.Battery_capacity.toFixed(2)),
                        Battery_current: Number(tq.Battery_current.toFixed(2)),
                        Battery_Power: Number(bat_pwr.toFixed(2)),
                        Inner_temperature: Number(tq.Inner_temperature.toFixed(2)),
                        External_battery_temperature: Number(tq.External_battery_temperature.toFixed(2)),
                        ph1_volt: Number(tq.ph1_volt.toFixed(2)),
                        ph2_volt: Number(tq.ph2_volt.toFixed(2)),
                        ph3_volt: Number(tq.ph3_volt.toFixed(2)),
                        ph1_current: Number(tq.ph1_current.toFixed(2)),
                        ph2_current: Number(tq.ph2_current.toFixed(2)),
                        ph3_current: Number(tq.ph3_current.toFixed(2)),
                        ph1_power: Number(tq.ph1_power.toFixed(2)),
                        ph2_power: Number(tq.ph2_power.toFixed(2)),
                        ph3_power: Number(tq.ph3_power.toFixed(2)),
                        ph1_powerVA: Number(tq.ph1_powerVA.toFixed(2)),
                        ph2_powerVA: Number(tq.ph2_powerVA.toFixed(2)),
                        ph3_powerVA: Number(tq.ph3_powerVA.toFixed(2)),
                        ph1_load: Number(ph1load.toFixed(2)),
                        ph2_load: Number(ph2load.toFixed(2)),
                        ph3_load: Number(ph3load.toFixed(2)),
                        ph1_amp_reactive: Number(tq.ph1_amp_reactive.toFixed(2)),
                        ph2_amp_reactive: Number(tq.ph2_amp_reactive.toFixed(2)),
                        ph3_amp_reactive: Number(tq.ph3_amp_reactive.toFixed(2)),
                        ph1_pf: Number(tq.ph1_pf.toFixed(2)),
                        ph2_pf: Number(tq.ph2_pf.toFixed(2)),
                        ph3_pf: Number(tq.ph3_pf.toFixed(2))
                    };
                    //console.log(db_save + "를 기록한다.");
                    mdb.collection("sum_q").insertOne(db_save, function(err, res) {
                        if (err) console.log(err);
                    });
                }
            } //             //15분단위 end
        } // 현재 minute가 변경되었다면? end

        // 날짜가 변경되었을 때라면?
        if (dbsum_day != new Date().getDate()) {
            dbsum_day = new Date().getDate(); //시간 갱신
            var tmpd = new moment();
            record_day(tmpd);

        } // 날짜 변경되었을 때 end


    } catch (err) {
        console.log(err);
    }
}, 1000);

setInterval(function() {
    try {
        if (SOC_Now <= 10 && SOC_Now > 3) // 배터리 용량이 10%이하일 경우라면
        {

            if (moderun == 1 || run.mode == 'discharge') {
                console.log("Capacity Low!");
                var date = new Date();
                console.log(date + " Battery Low Capacity - set to idle ");
                mode_idle();
            } else if (moderun != 0 || run.mode == 'charge'); {

            }
            //else if (moderun != 2 || run.mode != 'idle');
        } else if (SOC_Now <= 3) { // 배터리 용량이 3%이하일 경우라면
            if (moderun == 1 || run.mode == 'discharge' || moderun != 2 || run.mode != 'idle') {
                console.log("Capacity Very Low!");
                var date = new Date();
                console.log(date + " Battery Low Capacity - set to charge ");
                mode_charge(1000);
            } else if (moderun != 0 || run.mode == 'charge'); {

            }
            //else if (moderun != 2 || run.mode != 'idle'){}
        }

    } catch (err) {
        console.log(err);
    }
}, 60000); // 1분에 한번



function record_day(mmtd) {
    var td = {
        Time: 0,
        datetime: 0,
        d: new Date(),
        Solar_input_voltage_1: 0,
        Solar_input_power_1: 0,
        Solar_input_voltage_2: 0,
        Solar_input_power_2: 0,
        Battery_voltage: 0,
        Battery_capacity: 0,
        Battery_current: 0,
        Inner_temperature: 0,
        External_battery_temperature: 0,

        ph1_volt: 0,
        ph2_volt: 0,
        ph3_volt: 0,
        ph1_current: 0,
        ph2_current: 0,
        ph3_current: 0,
        ph1_power: 0,
        ph2_power: 0,
        ph3_power: 0,
        ph1_load: 0,
        ph2_load: 0,
        ph3_load: 0,
        ph1_powerVA: 0,
        ph2_powerVA: 0,
        ph3_powerVA: 0,
        ph1_amp_reactive: 0,
        ph2_amp_reactive: 0,
        ph3_amp_reactive: 0,
        ph1_pf: 0,
        ph2_pf: 0,
        ph3_pf: 0,
        update_opti: false,
        update_pwmt: false,
        t1: 0,
        t2: 0,
        qr: 0
    };
    var mt1 = mmtd; //moment(); // 조회할 테이블 시작 시간
    var mt2 = mmtd.clone().add(-1, 'day'); // 시작시간에서 1일 전의 시간

    td.t1 = new Date(mt1.format());
    td.t2 = new Date(mt2.format());
    //td.qr = { "datetime": { $gte: new Date(td.t2.format()), $lt: new Date(td.t1.format()) } };
    td.qr = {
        "datetime": {
            $gte: new Date(td.t2.getFullYear(), td.t2.getMonth(), td.t2.getDate(), 0, 10),
            $lt: new Date(td.t1.getFullYear(), td.t1.getMonth(), td.t1.getDate(), 0, 20)
        }
    };
    //  sum_h조회
    console.log(td.qr);
    mdb.collection('sum_q').find(td.qr).toArray(function(err, result) {
        if (err) console.log(err); //throw err;
        console.log("sum_q db today count = " + result.length);
        if (result.length > 0) {
            result.forEach(function(el, idx, arr) {
                td.Solar_input_voltage_1 += Number(el.Solar_input_voltage_1);
                td.Solar_input_power_1 += Number(el.Solar_input_power_1);
                td.Solar_input_voltage_2 += Number(el.Solar_input_voltage_2);
                td.Solar_input_power_2 += Number(el.Solar_input_power_2);
                td.Battery_voltage += Number(el.Battery_voltage);
                td.Battery_capacity += Number(el.Battery_capacity);
                td.Battery_current += Number(el.Battery_current);
                td.Inner_temperature += Number(el.Inner_temperature);
                td.External_battery_temperature += Number(el.External_battery_temperature);
                td.ph1_volt += Number(el.ph1_volt);
                td.ph2_volt += Number(el.ph2_volt);
                td.ph3_volt += Number(el.ph3_volt);
                td.ph1_current += Number(el.ph1_current);
                td.ph2_current += Number(el.ph2_current);
                td.ph3_current += Number(el.ph3_current);
                td.ph1_power += Number(el.ph1_power);
                td.ph2_power += Number(el.ph2_power);
                td.ph3_power += Number(el.ph3_power);
                td.ph1_load += Number(el.ph1_load);
                td.ph2_load += Number(el.ph2_load);
                td.ph3_load += Number(el.ph3_load);
                td.ph1_powerVA += Number(el.ph1_powerVA);
                td.ph2_powerVA += Number(el.ph2_powerVA);
                td.ph3_powerVA += Number(el.ph3_powerVA);
                td.ph1_amp_reactive += Number(el.ph1_amp_reactive);
                td.ph2_amp_reactive += Number(el.ph2_amp_reactive);
                td.ph3_amp_reactive += Number(el.ph3_amp_reactive);
                td.ph1_pf += Number(el.ph1_pf);
                td.ph2_pf += Number(el.ph2_pf);
                td.ph3_pf += Number(el.ph3_pf);
            });

            td.Solar_input_voltage_1 /= result.length;
            td.Solar_input_power_1 /= result.length;
            td.Solar_input_voltage_2 /= result.length;
            td.Solar_input_power_2 /= result.length;
            td.Battery_voltage /= result.length;
            td.Battery_capacity /= result.length;
            td.Battery_current /= result.length;
            td.Inner_temperature /= result.length;
            td.External_battery_temperature /= result.length;
            td.ph1_volt /= result.length;
            td.ph2_volt /= result.length;
            td.ph3_volt /= result.length;
            td.ph1_current /= result.length;
            td.ph2_current /= result.length;
            td.ph3_current /= result.length;
            td.ph1_power /= result.length;
            td.ph2_power /= result.length;
            td.ph3_power /= result.length;
            td.ph1_load /= result.length;
            td.ph2_load /= result.length;
            td.ph3_load /= result.length;
            td.ph1_powerVA /= result.length;
            td.ph2_powerVA /= result.length;
            td.ph3_powerVA /= result.length;
            td.ph1_amp_reactive /= result.length;
            td.ph2_amp_reactive /= result.length;
            td.ph3_amp_reactive /= result.length;
            td.ph1_pf /= result.length;
            td.ph2_pf /= result.length;
            td.ph3_pf /= result.length;
            var battery_pwr = td.Battery_voltage * td.Battery_current;
            //var ph1_load = td.ph1_power + (td.Solar_input_power_1 / 3) - (battery_pwr / 3);
            //var ph2_load = td.ph2_power + (td.Solar_input_power_1 / 3) - (battery_pwr / 3);
            //var ph3_load = td.ph3_power + (td.Solar_input_power_1 / 3) - (battery_pwr / 3);

            var dbsave = {
                Time: mt2.format('YYYY-MM-DD HH:mm:ss'), //td.t2.toISOString(),
                datetime: new Date(td.t2.toISOString()),
                Solar_input_voltage_1: Number(td.Solar_input_voltage_1.toFixed(2)),
                Solar_input_power_1: Number(td.Solar_input_power_1.toFixed(2)),
                Solar_input_voltage_2: Number(td.Solar_input_voltage_2.toFixed(2)),
                Solar_input_power_2: Number(td.Solar_input_power_2.toFixed(2)),
                Battery_voltage: Number(td.Battery_voltage.toFixed(2)),
                Battery_capacity: Number(td.Battery_capacity.toFixed(2)),
                Battery_current: Number(td.Battery_current.toFixed(2)),
                Battery_Power: Number(battery_pwr.toFixed(2)),
                Inner_temperature: Number(td.Inner_temperature.toFixed(2)),
                ph1_volt: Number(td.ph1_volt.toFixed(2)),
                ph2_volt: Number(td.ph2_volt.toFixed(2)),
                ph3_volt: Number(td.ph3_volt.toFixed(2)),
                ph1_current: Number(td.ph1_current.toFixed(2)),
                ph2_current: Number(td.ph2_current.toFixed(2)),
                ph3_current: Number(td.ph3_current.toFixed(2)),
                ph1_power: Number(td.ph1_power.toFixed(2)),
                ph2_power: Number(td.ph2_power.toFixed(2)),
                ph3_power: Number(td.ph3_power.toFixed(2)),
                ph1_powerVA: Number(td.ph1_powerVA.toFixed(2)),
                ph2_powerVA: Number(td.ph2_powerVA.toFixed(2)),
                ph3_powerVA: Number(td.ph3_powerVA.toFixed(2)),
                ph1_load: Number(td.ph1_load.toFixed(2)),
                ph2_load: Number(td.ph2_load.toFixed(2)),
                ph3_load: Number(td.ph3_load.toFixed(2)),
                ph1_amp_reactive: Number(td.ph1_amp_reactive.toFixed(2)),
                ph2_amp_reactive: Number(td.ph2_amp_reactive.toFixed(2)),
                ph3_amp_reactive: Number(td.ph3_amp_reactive.toFixed(2)),
                ph1_pf: Number(td.ph1_pf.toFixed(2)),
                ph2_pf: Number(td.ph2_pf.toFixed(2)),
                ph3_pf: Number(td.ph3_pf.toFixed(2))
            };
            mdb.collection("sum_d").insertOne(dbsave, function(err, res) {
                //console.log("sumd 기록을 시작한다.");
                if (err) console.log(err);
            });

        } else {}
    });
}

setInterval(function() {
    try {
            socupdate();
    }
    catch (err) {
        console.log("Battery Error");
        console.log(err);
    }
}, 200);


//21-08-29 배터리 용량 받아오는 부분 수정
var SOC_Now = 0;

function socupdate() {
    /*
    SOC_Now = 0;
    for (var i = 0; i < set.battery_count; i++) {
        //SOC_Now += (bm[i].SOC / set.battery_count);
    }
    SOC_Now = tofn(value_bms1.Residual_capacity, 3); //tofn(SOC_Now, 3);
    */
    // [20210906 Eugene] 배터리 모듈 분리 및 모듈 데이터 활용
    var total = 0;
    for (var i = 0; i < set.num_of_batt; i++) {
        total += battery.getJSON()[i].Residual_capacity;
        //console.log(battery.getJSON()[i].Residual_capacity);
    }
    if(set.num_of_batt != 0)
        SOC_Now = total / set.num_of_batt;
    else
        SOC_Now = total;
}

// 고정폭 길이의 숫자 문자열을 만든다. 고정폭은 3
function zerofil(val) {
    return ('000' + Number(val)).substr(-3);
}
// 고정폭 길이의 숫자 문자열을 만든다. 고정폭은 2
function zerofil2(val) {
    return ('00' + Number(val)).substr(-2);
}
// 고정폭 길이의 숫자 문자열을 만든다. 고정폭은 6
function zerofil4(val) {
    return ('0000' + Number(val)).substr(-4);
}
// 고정폭 길이의 숫자 문자열을 만든다. 고정폭은 6
function zerofil6(val) {
    return ('000000' + Number(val)).substr(-6);
}

function tof(num) {
    return Number(num.toFixed(1));
}

function tofn(num, j) {
    return Number(num.toFixed(j));
}

// checksum 정수 반환
function checksum(str) {
    var i;
    var chk = 0;
    for (i = 0; i < str.length; i++) {
        chk += str.charCodeAt(i);
    }
    return chk & 0xff;
}

function cloneobj(obj) {
    if (obj === null || typeof(obj) !== 'object')
        return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) {
            copy[attr] = obj[attr];
        }
    }
    return copy;
}


Array.prototype.sum = Array.prototype.sum || function() {
    return this.reduce(function(sum, a) { return sum + Number(a); }, 0);
};

Array.prototype.average = Array.prototype.average || function() {
    return this.sum() / (this.length || 1);
};

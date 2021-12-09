var Promise = require("bluebird");
var express = require('express');
var path = require('path');
var app = express();
var CORS = require('cors')();

var set = require('./set.js'); // 배터리 모듈의 설정 파일을 읽어온다.
var battery = require('./battery_jbd.js');          // [20210906 Eugene] 배터리 모듈 분리 및 모듈 데이터 활용
var pcs = require('./pcs_opti_10k.js');
var pm = require('./pm_estron_3ph.js');

app.use(CORS);

app.use(express.static(path.join(__dirname, 'html')));

app.use('/js_module', express.static(__dirname + "/js_module"));

app.use('/iconfont', express.static(__dirname + "/iconfont"));

app.use(express.json());

app.get("/site_info", function(req, res){
    var re = {
        Client_Code: set.Client_Code,
        Client_SRC: set.Client_SRC,
        ESS_Total_Capacity: set.ESS_Total_Capacity,
        ESS_Installed_date: set.ESS_Installed_date,
        MAX_Solar: set.MAX_Solar,
        MAX_Load: set.MAX_Load,
        MAX_Grid: set.MAX_Grid,
        MAX_Batt: set.MAX_Batt,
        Location_Lati: set.Location_Lati,
        Location_Longi: set.Location_Longi
    };
    res.json(re);
});

// HomeESS버전의 power meter를 대체할 변수[21.10.18]
var batcapa = 0; // 배터리 용량
var meter = {
    check_day: 0,
    grid_month_import_active_energy: 0,
    grid_month_export_active_energy: 0,
    grid_daily_import_active_energy: 0,
    grid_daily_export_active_energy: 0,

    load_month_import_active_energy: 0,
    load_month_export_active_energy: 0,
    load_daily_import_active_energy: 0,
    load_daily_export_active_energy: 0,
    solar_month_energy: 0
};

//Web Server용
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'html', 'ess.html'));
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

// 버튼 컨트롤 용
app.get("/set_mode", function(req, res) {
    var ins = req.query.ins;
    if (ins == 1) {
        console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + "set_mode /" + "charge!");
        mode_charge(false);
    } else if (ins == 2) {
        console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + "set_mode /" + "discharge!");
        mode_discharge(false);
    } else if (ins == 3) {
        console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + "set_mode /" + "idle!");
        mode_idle(false);
    } else if (ins == 'a') {
        console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + "set_mode /" + "force charge!");
        mode_charge(true);
    } else if (ins == 'b') {
        console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + "set_mode /" + "force discharge!");
        mode_discharge(true);
    } else if (ins == 'c') {
        console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + "set_mode /" + "force idle!");
        mode_idle(true);
    }
    res.json('ok');
});


app.get("/send_opti", function(req, res) {
    var ins = req.query.ins;
    console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + "send_opti " + "ins = " + ins);
    port_opti.write(ins + "\r");
    res.json('ok');
});


app.get("/current_kwhq", function(req, res) {
    if (mongoconnected) {
        if (res_kwhq.alive < 10){
            //console.log("case 1: " + res_kwhq.alive);
            res.json(res_kwhq);
        }
        else {
            //console.log("case 2: " + res_kwhq.alive);
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


//[2021.10.18 월간 데이터 쿼리 추가] [수빈]
var res_monthly_usage = {
    solar: 0,
    ph1_load: 0,
    ph2_load: 0,
    ph3_load: 0,
    ph1_power: 0,
    ph2_power: 0,
    ph3_power: 0,
    battery: 0,
};

function init_monthly_usage() {
    return new Promise(function(resolve, reject) {
        //console.log(month.format());
        var t1 = new Date (Date.now());
        var t2 = new Date (Date.now());
        t1.setDate(1);
        t2.setDate(t2.getDate()-1);
        //var t1 = new Date(month.format());
        //var t2 = new Date(month.format());
        //console.log("init_monthly_usage");
        //console.log(t1);
        //console.log(t2);
        
        res_monthly_usage = {
            solar: 0,
            load: 0,
            battery: 0,
            ph1_load: 0,
            ph2_load: 0,
            ph3_load: 0,           
            ph1_power: 0,
            ph2_power: 0,
            ph3_power: 0,
        };
        if (t1.getDate() == 0){
            return;
        }
        // 조회일의 00시부터 현재 시간까지 시간별 Kwh데이터를 쿼리한다.
        var qr = {
            "Time": {
                $gte: new Date(t1.getFullYear(), t1.getMonth(), t1.getDate(), 0, 0, 0).toISOString(),
                $lt: new Date(t2.getFullYear(), t2.getMonth(), t2.getDate(), 0, 0, 0).toISOString()
            }
        };
        //console.log("월간별 log조회를 시작한다.");
        //console.log(qr);
    
        mdb.collection('sum_d').find(qr).toArray(function(err, result) {
            if (err) console.log(err); //throw err;
            else {
                //console.log(result.length);
                if (result.length > 0) {
                    console.log("sum_d에서" + result.length + "개가 조회됨");
                    result.forEach(function(el, idx, arr) {
                        //console.log(el.ph1_load);
                        res_monthly_usage.solar += Number(el.Solar_input_power1);
                        res_monthly_usage.load += Number(el.ph1_load) + (Number(el.ph2_load)) + (Number(el.ph3_load));
                        res_monthly_usage.ph1_load += Number(el.ph1_power) + (Number(el.Solar_input_power1) / 3) - (Number(el.Battery_Power) / 3);
                        res_monthly_usage.ph2_load += Number(el.ph2_power) + (Number(el.Solar_input_power1) / 3) - (Number(el.Battery_Power) / 3);
                        res_monthly_usage.ph3_load += Number(el.ph3_power) + (Number(el.Solar_input_power1) / 3) - (Number(el.Battery_Power) / 3);
                        res_monthly_usage.ph1_power += Number(el.ph1_power);
                        res_monthly_usage.ph2_power += Number(el.ph2_power);
                        res_monthly_usage.ph3_power += Number(el.ph3_power);
                        res_monthly_usage.battery += Number(el.Battery_capacity);

                    });
                    console.log(res_monthly_usage.load);
                    //console.log(res_monthly_usage.ph1_load);
                    //resolve(JSON.stringify(res_month));
                    resolve(res_monthly_usage);
                } //else console.log("해당 월의 sum_d의 " + qr + "에서 데이터가 조회되지 않음");
            }
        });
    });
}

function log_monthly(month) {
    return new Promise(function(resolve, reject) {
        console.log(month.format());
        var t1 = new Date(month.format());
        var t2 = new Date(month.format());
        t2.setMonth(t1.getMonth() + 1);
        var res_month = {
            Time: [],
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
        //console.log(t1);
        //console.log(t2);

        //console.log("월간별 log조회를 시작한다.");
        //console.log(qr);
        mdb.collection('sum_d').find(qr).toArray(function(err, result) {
            if (err) console.log(err); //throw err;
            else {
                if (result.length > 0) {
                    //console.log("sum_d에서" + result.length + "개가 조회됨");
                    result.forEach(function(el, idx, arr) {
                        res_month.Time.push(el.Time);
                        res_month.solar += Number(el.Solar_input_power1);
                        res_month.ph1_load += Number(el.ph1_power) + (Number(el.Solar_input_power1) / 3) - (Number(el.Battery_Power) / 3);
                        res_month.ph2_load += Number(el.ph2_power) + (Number(el.Solar_input_power1) / 3) - (Number(el.Battery_Power) / 3);
                        res_month.ph3_load += Number(el.ph3_power) + (Number(el.Solar_input_power1) / 3) - (Number(el.Battery_Power) / 3);
                        res_month.ph1_power += Number(el.ph1_power);
                        res_month.ph2_power += Number(el.ph2_power);
                        res_month.ph3_power += Number(el.ph3_power);
                        res_month.battery += Number(el.Battery_capacity);
                        res_month.arr_datetimes.push(el.datetime);
                        res_month.arr_solar.push(Number(el.Solar_input_power1));
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
                } 
                else 
                {
                    console.log("해당 월의 sum_d의 " + /*qr*/ + "에서 데이터가 조회되지 않음");
                    resolve(res_month);
                }
            }
        });
    });
}


// 일간 데이터 로그 요청받는 부분
app.get("/log_day", function(req, res) {
    //console.log(req.query.date);
    var res_day = {
        index: [],
        Time: [], // "2018-05-09 12:45:00",
        datetime: [], // ISODate("2018-05-09T03:45:00.032Z"),
        solar: 0,
        solar_input_power1: [],
        solar_input_power2: [],
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
    // 요청받은 date가 존재하지 않는다면 빈 json을 보낸다.
    if (typeof(req.query.date) == "undefined") {
        res.json(res_day);
        return;
    }

    var logday = moment(req.query.date);
    console.log(moment().format('YYYY-MM-DD HH:mm:ss') + " logday requested " + logday);

    var t1 = new Date(logday.format());
    var t2 = new Date(logday.format());
    t2.setDate(t1.getDate() + 1);
    var qr = {
        "datetime": {
            $gte: new Date(t1.getFullYear(), t1.getMonth(), t1.getDate(), 0, 5),
            $lt: new Date(t2.getFullYear(), t2.getMonth(), t2.getDate(), 0, 2)
        }
    };

    mdb.collection('sum_q').find(qr).sort({ 'datetime': 1 }).toArray(function(err, result) {
        //mdb.collection('sum_h').find(qr).toArray.then(function(err, result) {
        if (err) {
            console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + err);
            //res.json(err);
            return;
        }
        if (result.length > 0) {
            result.forEach(function(el, idx, arr) {
                res_day.index.push(el.index);
                res_day.Time.push(el.Time);
                res_day.datetime.push(el.datetime);
                res_day.solar_input_power1.push(el.Solar_input_power1);
                res_day.solar_input_power2.push(el.Solar_input_power2);
                res_day.solar += Number(el.Solar_input_power1 + el.Solar_input_power2);
                res_day.ph1_load += Number(el.ph1_power) + (Number(el.Solar_input_power1 + el.Solar_input_power2) / 3) - (Number(el.Battery_Power) / 3);
                res_day.ph2_load += Number(el.ph2_power) + (Number(el.Solar_input_power1 + el.Solar_input_power2) / 3) - (Number(el.Battery_Power) / 3);
                res_day.ph3_load += Number(el.ph3_power) + (Number(el.Solar_input_power1 + el.Solar_input_power2) / 3) - (Number(el.Battery_Power) / 3);
                res_day.ph1_power += Number(el.ph1_power);
                res_day.ph2_power += Number(el.ph2_power);
                res_day.ph3_power += Number(el.ph3_power);
                res_day.battery += Number(el.Battery_capacity);
                res_day.arr_datetimes.push(el.datetime);
                res_day.arr_solar.push(Number(el.Solar_input_power1 + el.Solar_input_power2));
                res_day.arr_ph1_load.push(Number(el.ph1_load));
                res_day.arr_ph2_load.push(Number(el.ph2_load));
                res_day.arr_ph3_load.push(Number(el.ph3_load));
                res_day.arr_ph1_power.push(Number(el.ph1_power));
                res_day.arr_ph2_power.push(Number(el.ph2_power));
                res_day.arr_ph3_power.push(Number(el.ph3_power));
                res_day.arr_battery.push(Number(el.Battery_capacity));
                res_day.arr_battery_power.push(Number(el.Battery_Power));

            });
        }
        // sumq에서 데이터가 조회 안된다면
        res.json(res_day); // 그냥 빈json이라도 응답해준다.
    });

});

app.get("/log_day", function(req, res) {
    //console.log(req.query.date);
    var logday = moment(req.query.date);
    //console.log(logday);

    log_daily(logday).then(function(total) {
        //console.log(total);
        res.json(total);
    });
});

function log_daily(day) {
    return new Promise(function(resolve, reject) {
        var t1 = new Date(day.format());
        var t2 = new Date(day.format());
        t2.setDate(t1.getDate() + 1);
        var res_day = {
            solar: 0,
            solar_input_power1: [],
            solar_input_power2: [],
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
                        res_day.solar_input_power1.push(el.Solar_input_power1);
                        res_day.solar_input_power2.push(el.Solar_input_power2);
                        res_day.solar += Number(el.Solar_input_power1 + el.Solar_input_power2);
                        res_day.ph1_load += Number(el.ph1_power) + (Number(el.Solar_input_power1 + el.Solar_input_power2) / 3) - (Number(el.Battery_Power) / 3);
                        res_day.ph2_load += Number(el.ph2_power) + (Number(el.Solar_input_power1 + el.Solar_input_power2) / 3) - (Number(el.Battery_Power) / 3);
                        res_day.ph3_load += Number(el.ph3_power) + (Number(el.Solar_input_power1 + el.Solar_input_power2) / 3) - (Number(el.Battery_Power) / 3);
                        res_day.ph1_power += Number(el.ph1_power);
                        res_day.ph2_power += Number(el.ph2_power);
                        res_day.ph3_power += Number(el.ph3_power);
                        res_day.battery += Number(el.Battery_capacity);
                        res_day.arr_datetimes.push(el.datetime);
                        res_day.arr_solar.push(Number(el.Solar_input_power1 + el.Solar_input_power2));
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

app.get('/log_report2', function(req, res) {
    //console.log(req.query.date);
    var spl = req.query.date.split('-');
    console.log('0=' + spl[0]);
    console.log('1=' + spl[1]);
    var mt = Number(spl[1]) - 1;
    var yt = Number(spl[0]);
    var mon = new Date(yt, mt, 1);

    var logmonth = moment(mon);
    console.log(logmonth);

    log_monthly(logmonth).then(function(total) {
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




// vuejs용 이벤트 메시지 추가 [21.10.14]
var eventmessage = '';

//이벤트 처리
app.get("/clear_event", function(req, res) {
    clear_event();
    res.json('OK');
});

//수동이벤트 설정
app.get("/set_event", function(req, res) {
    set_event(req.query.event);
    res.json('OK');
});

function set_event(msg) {
    eventmessage = msg;
    return 1;
}

function clear_event() {
    eventmessage = '';
    return 0;
}


// ESS 현재 상태 알려줌 (Vue 버전)

app.get("/current_ess_vue", function(req, res) {
    
    var pcs_json = pcs.getJSON();

    var res_ess = {
        datetime: new Date(),
        event: eventmessage,
        mode: run.mode,
        Solar_input_voltage_1: 0,
        Solar_input_voltage_2: 0,
        Solar_input_current_1: 0,
        Solar_input_current_2: 0,
        Solar_input_power1: 0,
        Solar_input_power2: 0,
        Solar_input_power_1: 0,
        Solar_input_power_2: 0,
        Battery_voltage: 0,
        Battery_capacity: 0,
        Battery_current: 0,
        Battery_power: 0,
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

        Inner_temperature: 0,

        AC_output_active_power: 0,
        AC_output_total_active_power: 0,
        AC_output_power_percentage: 0,
        AC_output_connect_status: 0,
        Solar_input_1_work_status: 0,
        Solar_input_2_work_status: 0,
        Battery_power_direction: 0,
        power_direction_DCAC: 0,
        power_direction_line: 0,

        pm_volt: 0,
        pm_current: 0,
        pm_active_pwr: 0,
        pm_apparent_pwr: 0,
        pm_reactive_pwr: 0,
        pm_pf: 0,
        pm_import_active_energy: 0,
        pm_export_active_energy: 0,

        ld_volt: 0,
        ld_current: 0,
        ld_active_pwr: 0,   /// vue 사용
        ld_apparent_pwr: 0,
        ld_reactive_pwr: 0,
        ld_monthly_pwr: 0, /// vue 월간 사용량
        ld_pf: 0,
        ld_import_active_energy: 0,
        ld_export_active_energy: 0,

        check_day: meter.check_day,
        grid_daily_import_active_energy: meter.grid_daily_import_active_energy,
        grid_daily_export_active_energy: meter.grid_daily_export_active_energy,
        grid_month_import_active_energy: meter.grid_month_import_active_energy,
        grid_month_export_active_energy: meter.grid_month_export_active_energy,

        load_daily_import_active_energy: meter.load_daily_import_active_energy,
        load_daily_export_active_energy: meter.load_daily_export_active_energy,
        load_month_import_active_energy: meter.load_month_import_active_energy,
        load_month_export_active_energy: meter.load_month_export_active_energy,
    };

    res_ess.datetime = new Date();
    res_ess.Battery_voltage = Number(pcs_json.Battery_voltage.toFixed(2));
    res_ess.Battery_capacity = Number(tof(SOC_Now));
    res_ess.Battery_current = Number(pcs_json.Battery_current.toFixed(2));
    res_ess.Battery_power = Number((pcs_json.Battery_voltage * pcs_json.Battery_current).toFixed(2));
    res_ess.Solar_input_voltage_1 = Number(pcs_json.Solar_input_voltage_1.toFixed(2));
    res_ess.Solar_input_voltage_2 = Number(pcs_json.Solar_input_voltage_2.toFixed(2));
    res_ess.Solar_input_current_1 = Number(pcs_json.Solar_input_current_1);
    res_ess.Solar_input_current_2 = Number(pcs_json.Solar_input_current_2);
    res_ess.Solar_input_power1 = Number(pcs_json.Solar_input_power1.toFixed(2));    
    res_ess.Solar_input_power2 = Number(pcs_json.Solar_input_power2.toFixed(2));    
    res_ess.Inner_temperature = Number(pcs_json.Inner_temperature);
    res_ess.ph1_load = Number(pcs_json.AC_output_active_power_R);
    res_ess.ph2_load = Number(pcs_json.AC_output_active_power_S);
    res_ess.ph3_load = Number(pcs_json.AC_output_active_power_T);
    res_ess.ld_monthly_pwr = Number(res_monthly_usage.load);
    res_ess.ld_active_pwr = Number(pcs_json.AC_output_total_active_power);

    res.json(res_ess);
});


// ESS 현재 상태 알려줌 (JS버전_ 1번)
app.get("/current_ess", function(req, res) {

    var pcs_json = pcs.getJSON();
    //var pcs_gs_array = pcs.getJSON_gs_array();
    //var pcs_ps_array = pcs.getJSON_ps_array();
    //console.log(pcs_json);
    //console.log(pcs_gs_array);
    var pm_json = pm.getJSON();

    var res_ess = {
        datetime: new Date(),
        mode: moderun,
        event: eventmessage,
        Solar_input_voltage_1: 0,
        Solar_input_voltage_2: 0,
        Solar_input_power1: 0,  // value_gs에서 오는 power (V*A)
        Solar_input_power2: 0, // value_gs에서 오는 power (V*A)
        Solar_input_power_1: 0,  // value_ps에서 오는 power
        Solar_input_power_2: 0,  // value_ps에서 오는 power
        Solar_input_current_1: 0,
        Solar_input_current_2: 0,
        Battery_voltage: 0,
        Battery_capacity: 0,
        Battery_total_capacity: 100 * set.num_of_batt, //[TBM]
        Battery_current: 0,
        Battery_Power: 0,
        AC_input_voltage_R: 220,
        AC_input_voltage_S: 220,
        AC_input_voltage_T: 220,

        AC_output_active_power_R: 0,
        AC_output_active_power_S: 0,
        AC_output_active_power_T: 0,
        AC_output_total_active_power: 0,

        AC_output_amp_R: 0,
        AC_output_amp_S: 0,
        AC_output_amp_T: 0,

        ld_current: 0,

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
        ld_volt: 0,
        ph1_amp_reactive: 0,
        ph2_amp_reactive: 0,
        ph3_amp_reactive: 0,
        ph1_pf: 0,
        ph2_pf: 0,
        ph3_pf: 0,
    };
        
        res_ess.datetime = new Date();
        res_ess.event = eventmessage,
        res_ess.Solar_input_voltage_1 = pcs_json.Solar_input_voltage_1;
        res_ess.Solar_input_voltage_2 = pcs_json.Solar_input_voltage_2;
        res_ess.Solar_input_power1 = pcs_json.Solar_input_power1;  // value_gs에서 오는 power (V*A)
        res_ess.Solar_input_power2 = pcs_json.Solar_input_power2; // value_gs에서 오는 power (V*A)
        res_ess.Solar_input_power_1 = pcs_json.Solar_input_power_1;  // value_ps에서 오는 power
        res_ess.Solar_input_power_2 = pcs_json.Solar_input_power_2;  // value_ps에서 오는 power
        res_ess.Solar_input_current_1 = pcs_json.Solar_input_current_1;
        res_ess.Solar_input_current_2 = pcs_json.Solar_input_current_2;
        res_ess.Battery_voltage = pcs_json.Battery_voltage;
        res_ess.Battery_capacity = pcs_json.Battery_capacity;
        res_ess.Battery_total_capacity = 100 * set.num_of_batt, //[TBM]
        res_ess.Battery_current = pcs_json.Battery_current;
        res_ess.Battery_Power = pcs_json.Battery_Power;
        res_ess.AC_input_voltage_R = pcs_json.ph1_volt;
        res_ess.AC_input_voltage_S = pcs_json.ph2_volt;
        res_ess.AC_input_voltage_T = pcs_json.ph3_volt;

        res_ess.AC_output_active_power_R = pcs_json.AC_output_active_power_R;
        res_ess.AC_output_active_power_S = pcs_json.AC_output_active_power_S;
        res_ess.AC_output_active_power_T = pcs_json.AC_output_active_power_T;
        res_ess.AC_output_total_active_power = pcs_json.AC_output_total_active_power;

        res_ess.AC_output_amp_R = pcs_json.AC_output_amp_R;
        res_ess.AC_output_amp_S = pcs_json.AC_output_amp_S;
        res_ess.AC_output_amp_T = pcs_json.AC_output_amp_T;
     
        res_ess.ph1_volt = pcs_json.ph1_volt;
        res_ess.ph2_volt = pcs_json.ph2_volt;
        res_ess.ph3_volt = pcs_json.ph3_volt;
        res_ess.ph1_current = pcs_json.AC_input_current_R;
        res_ess.ph2_current = pcs_json.AC_input_current_S;
        res_ess.ph3_current = pcs_json.AC_input_current_T;
        res_ess.ph1_power = pm_json.ph1_power;
        res_ess.ph2_power = pm_json.ph2_power;
        res_ess.ph3_power = pm_json.ph3_power;
        res_ess.ph1_powerVA = pm_json.ph1_powerVA;
        res_ess.ph2_powerVA = pm_json.ph2_powerVA;
        res_ess.ph3_powerVA = pm_json.ph3_powerVA;
        res_ess.ph1_load = pcs_json.AC_output_active_power_R;
        res_ess.ph2_load = pcs_json.AC_output_active_power_S;
        res_ess.ph3_load = pcs_json.AC_output_active_power_T;
        res_ess.ld_current = (pcs_json.AC_output_amp_R + pcs_json.AC_output_amp_S + pcs_json.AC_output_amp_T);
        res_ess.ld_volt =((pcs_json.AC_output_voltage_R + pcs_json.AC_output_voltage_S + pcs_json.AC_output_voltage_T) / 3);
        res_ess.ph1_amp_reactive = pm_json.ph1_amp_reactive;
        res_ess.ph2_amp_reactive = pm_json.ph2_amp_reactive;
        res_ess.ph3_amp_reactive = pm_json.ph3_amp_reactive;
        res_ess.ph1_pf = pm_json.ph1_pf;
        res_ess.ph2_pf = pm_json.ph2_pf;
        res_ess.ph3_pf = pm_json.ph3_pf;
        
        res.json(res_ess);
});

// ESS 현재 상태 알려줌 (JS버전_ 1번)
app.get("/current_ess2", function(req, res) {
    var battery_pwr, ph1_load, ph2_load, ph3_load;
    var res_ess = {
        datetime: new Date(),
        event: eventmessage,
        Solar_input_voltage_1: 0,
        Solar_input_voltage_2: 0,
        Solar_input_power1: 0,  // value_gs에서 오는 power (V*A)
        Solar_input_power2: 0, // value_gs에서 오는 power (V*A)
        Solar_input_power_1: 0,  // value_ps에서 오는 power
        Solar_input_power_2: 0,  // value_ps에서 오는 power
        Solar_input_current_1: 0,
        Solar_input_current_2: 0,
        Battery_voltage: 0,
        Battery_capacity: 0,
        Battery_current: 0,
        Battery_Power: 0,
        AC_input_voltage_R: 220,
        AC_input_voltage_S: 220,
        AC_input_voltage_T: 220,

        AC_output_active_power_R: 0,
        AC_output_active_power_S: 0,
        AC_output_active_power_T: 0,
        AC_output_total_active_power: 0,

        AC_output_amp_R: 0,
        AC_output_amp_S: 0,
        AC_output_amp_T: 0,

        ld_current: 0,

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
        ld_volt: 0,
        ph1_amp_reactive: 0,
        ph2_amp_reactive: 0,
        ph3_amp_reactive: 0,
        ph1_pf: 0,
        ph2_pf: 0,
        ph3_pf: 0,
    };
    res_ess.datetime = new Date();
    res_ess.Solar_input_voltage_1 = Number(value_gs.Solar_input_voltage_1.toFixed(2));
    res_ess.Solar_input_power1 = Number(value_gs.Solar_input_power1.toFixed(2));
    res_ess.Solar_input_voltage_2 = Number(value_gs.Solar_input_voltage_2.toFixed(2));
    res_ess.Solar_input_power2 = Number(value_gs.Solar_input_power2.toFixed(2));
    res_ess.Solar_input_current_1 = Number(value_gs.Solar_input_current_1);
    res_ess.Solar_input_current_2 = Number(value_gs.Solar_input_current_2);
    res_ess.Battery_voltage = Number(value_gs.Battery_voltage.toFixed(2));
    res_ess.Battery_capacity = Number(SOC_Now);
    res_ess.Battery_current = Number(value_gs.Battery_current.toFixed(2));
    res_ess.Battery_Power = Number((value_gs.Battery_voltage * value_gs.Battery_current).toFixed(2));
    res_ess.ph1_volt = Number(value_gs.AC_input_voltage_R.toFixed(2));
    res_ess.ph2_volt = Number(value_gs.AC_input_voltage_S.toFixed(2));
    res_ess.ph3_volt = Number(value_gs.AC_input_voltage_T.toFixed(2));
    res_ess.AC_output_active_power_R = Number(value_ps.AC_output_active_power_R);
    res_ess.AC_output_active_power_S = Number(value_ps.AC_output_active_power_S);
    res_ess.AC_output_active_power_T = Number(value_ps.AC_output_active_power_T);
    res_ess.AC_output_amp_R = Number(value_ps.AC_output_active_power_R / value_gs.AC_output_voltage_R);
    res_ess.AC_output_amp_S = Number(value_ps.AC_output_active_power_S / value_gs.AC_output_voltage_S);
    res_ess.AC_output_amp_T = Number(value_ps.AC_output_active_power_T / value_gs.AC_output_voltage_T);
    res_ess.ld_current = Number(res_ess.AC_output_amp_R + res_ess.AC_output_amp_S + res_ess.AC_output_amp_T);

    
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
    res_ess.ld_volt = Number(value_gs.AC_output_voltage_R);
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
        console.log(moment().format('YYYY-MM-DD HH:mm:ss') + "mongoconnect " + "ERROR : " + err); //throw err;
    }
    mdb = db;
    mongoconnected = true;
    console.log(moment().format('YYYY-MM-DD HH:mm:ss') + "/" + "MongoDB Connected!");
    // 배터리 잔량을 읽는다.
    mdb.collection('stat').find().toArray(function(err, result) {
        console.log(result);
        if (err) {
            console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + err); //throw err;
            //res.json(rt);
        } else {
            if (result.length > 0) {
                batcapa = result[0].Bat_Capa;
                meter.check_day = result[0].check_day;
                meter.grid_month_import_active_energy = result[0].grid_month_import_active_energy;
                meter.grid_month_export_active_energy = result[0].grid_month_export_active_energy;

                meter.grid_daily_import_active_energy = result[0].grid_daily_import_active_energy;
                meter.grid_daily_export_active_energy = result[0].grid_daily_export_active_energy;

                meter.load_month_import_active_energy = result[0].load_month_import_active_energy;
                meter.load_month_export_active_energy = result[0].load_month_export_active_energy;

                meter.load_daily_import_active_energy = result[0].load_daily_import_active_energy;
                meter.load_daily_export_active_energy = result[0].load_daily_export_active_energy;

                meter.solar_month_energy = result[0].solar_month_energy;
            }
        }
    });
});


var res_kwhq = {
    time: [],
    solar: 0,
    ph1_load: 0,
    ph2_load: 0,
    ph3_load: 0,
    ph1_power: 0,
    ph2_power: 0,
    ph3_power: 0,
    battery: 0,
    solar_input_power1: [],
    solar_input_power2: [],
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
    pm_active_pwr: [],
    pm_pf: [],
    ld_active_pwr: [],
    ld_pf: [],
    solar_month_energy: 0,
    
    alive: 999
};


function check_kwhq() {
    return new Promise(function(resolve, reject) {
        var t1 = new Date();
        var t2 = new Date();
        t2.setDate(t1.getDate() + 1);
        res_kwhq = {
            Time: [],
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

            pm_active_pwr: [],
            pm_pf: [],
            ld_active_pwr: [],
            ld_pf: [],
            solar_month_energy: 0,
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
                        res_kwhq.Time.push(el.Time);
                        res_kwhq.solar += Number(el.Solar_input_power1 + el.Solar_input_power2);
                        res_kwhq.ph1_load += Number(el.ph1_load);
                        res_kwhq.ph2_load += Number(el.ph2_load);
                        res_kwhq.ph3_load += Number(el.ph3_load);
                        res_kwhq.ph1_power += Number(el.ph1_power);
                        res_kwhq.ph2_power += Number(el.ph2_power);
                        res_kwhq.ph3_power += Number(el.ph3_power);
                        res_kwhq.battery += Number(el.Battery_capacity);
                        res_kwhq.arr_datetimes.push(el.datetime);
                        res_kwhq.arr_solar.push(Number(Number(el.Solar_input_power1).toFixed(2)));
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
                    
                    pcs_gs_array = pcs.getJSON_gs_array();
                    pcs_ps_array = pcs.getJSON_ps_array();
                    var tmp_solar;
                    var tmp_bat_pwr;
                    var tmp_bat_cap;
                    if (pcs_gs_array.cnt > 0) {
                        tmp_solar = pcs_gs_array.Solar_input_power1.average();
                        tmp_bat_pwr = pcs_gs_array.Battery_voltage.average() * pcs_gs_array.Battery_current.average();
                    } else {
                        tmp_solar = 0;
                        tmp_bat_pwr = 0;
                        tmp_bat_cap = 0;
                    }
                    tmp_bat_cap = SOC_Now;

                    var tmp_ph1_pwr;
                    var tmp_ph2_pwr;
                    var tmp_ph3_pwr;

                    tmp_ph1_pwr = pcs_ps_array.AC_input_active_power_R.average();
                    tmp_ph2_pwr = pcs_ps_array.AC_input_active_power_S.average();
                    tmp_ph3_pwr = pcs_ps_array.AC_input_active_power_T.average();
                    qhour_ph1_power = tmp_ph1_pwr;
                    qhour_ph2_power = tmp_ph2_pwr;
                    qhour_ph3_power = tmp_ph3_pwr;
                    
                    var tmp_ph1_load = pcs_ps_array.AC_output_active_power_R.average();
                    var tmp_ph2_load = pcs_ps_array.AC_output_active_power_S.average();
                    var tmp_ph3_load = pcs_ps_array.AC_output_active_power_T.average();

                    var d = new Date();
                    var t1 = moment();

                    res_kwhq.solar += tmp_solar;
                    res_kwhq.ph1_load += tmp_ph1_load;
                    res_kwhq.ph2_load += tmp_ph2_load;
                    res_kwhq.ph3_load += tmp_ph3_load;
                    res_kwhq.ph1_power += tmp_ph1_pwr;
                    res_kwhq.ph2_power += tmp_ph2_pwr;
                    res_kwhq.ph3_power += tmp_ph3_pwr;
                    res_kwhq.battery += pcs_gs_array.Battery_capacity.average();
                    res_kwhq.Time.push(t1.format('YYYY-MM-DD HH:mm:ss'));
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



var moderun;
var port_opti = pcs.get_port();

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
        //port_opt2.write('^S005EDA1\r'); // 배터리 충전 허용
        port_opti.write("^S005EDB1\r"); // 배터리 AC충전 허용
        //port_opt2.write("^S005EDB1\r"); // 배터리 AC충전 허용
        //port_opti.write("^S005EDC1\r"); // 공공망에 파워 공급 허용 X
        //port_opt2.write("^S005EDC1\r"); // 공공망에 파워 공급 허용 X
        port_opti.write("^S005EDD1\r"); // 태양광 입력이 정상일때 부하로 배터리 방전을 허용.
        //port_opt2.write("^S005EDD1\r"); // 태양광 입력이 정상일때 부하로 배터리 방전을 허용.
        port_opti.write("^S005EDE1\r"); // 태양광 입력이 없을때 배터리 방전을 허용.
        //port_opt2.write("^S005EDE1\r"); // 태양광 입력이 없을때 배터리 방전을 허용.
        port_opti.write("^S005EDF1\r"); // 태양광 입력이 정상일때 공공망으로 배터리 방전 X
        //port_opt2.write("^S005EDF1\r"); // 태양광 입력이 정상일때 공공망으로 배터리 방전 X
        port_opti.write("^S005EDG1\r"); // 태양광 입력이 없을때 공공망으로 배터리 방전 X
        //port_opt2.write("^S005EDG1\r"); // 태양광 입력이 없을때 공공망으로 배터리 방전 X
        port_opti.write("^S005EDH1\r"); // 공급파워에 따라 PF 자동 조절 비활성화(sp10K만 있음)
        //port_opt2.write("^S005EDH1\r"); // 공급파워에 따라 PF 자동 조절 비활성화(sp10K만 있음)

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
        //port_opt2.write(snd);
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
        port_opti.write('^S005EDA1\r');
        //port_opt2.write('^S005EDA1\r');
        port_opti.write('^S005EDB0\r');
        //port_opt2.write('^S005EDB0\r');
        //port_opti.write('^S005EDC1\r');
        //port_opt2.write('^S005EDC1\r');
        port_opti.write('^S005EDD1\r');
        //port_opt2.write('^S005EDD1\r');
        port_opti.write('^S005EDE1\r');
        //port_opt2.write('^S005EDE1\r');
        port_opti.write('^S005EDF1\r');
        //port_opt2.write('^S005EDF1\r');
        port_opti.write('^S005EDG1\r');
        //port_opt2.write('^S005EDG1\r');
        port_opti.write('^S005EDH1\r');
        //port_opt2.write('^S005EDH1\r');
    }
    if (pwr) {
        if (pwr > 7500) pwr = 7500;
        var snd = "^S011GPMP" + zerofil6(parseInt(pwr)) + "\r"; // Set max power of feeding grid
        port_opti.write(snd);
        //port_opt2.write(snd);
        //console.log(date + "discharge pwr change : " + snd);
    } else{
        port_opti.write("S011GPMP007500\r");
        //port_opt2.write("S011GPMP007500\r");
    }
}

function mode_idle() {
    if (moderun != 2 || run.mode != 'idle') {
        moderun = 2;
        run.mode = 'idle';
        console.log("IDLE MODE");
        port_opti.write('^S005EDA1\r');
        //port_opt2.write('^S005EDA1\r');
        port_opti.write('^S005EDB0\r');
        //port_opt2.write('^S005EDB0\r');
        //port_opti.write('^S005EDC1\r');
        //port_opt2.write('^S005EDC1\r');
        port_opti.write('^S005EDD0\r');
        //port_opt2.write('^S005EDD0\r');
        port_opti.write('^S005EDE0\r');
        //port_opt2.write('^S005EDE0\r');
        port_opti.write('^S005EDF0\r');
        //port_opt2.write('^S005EDF0\r');
        port_opti.write('^S005EDG0\r');
        //port_opt2.write('^S005EDG0\r');
        port_opti.write('^S005EDH0\r');
        //port_opt2.write('^S005EDH0\r');
    }
}




// http://192.168.0.134/send_opti?ins=^P005PIRI 이런식으로 수동 명령어를 보내볼 수 있다. 아주 여러번 보내봐야 결과값이 보일 수 있다.
app.get("/send_opti", function(req, res) {
    var ins = req.query.ins;
    console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + "send_opti " + "ins = " + ins);
    port_opti.write(ins + "\r");
    res.json('ok');
});

app.get('/send_opti2', function(req, res) {
    var ins = req.query.ins;
    console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + 'send_opti2 ' + 'ins = ' + ins);
    port_opt2.write(ins + '\r');
    res.json('ok');
});


function send_opti_with_crc(sendstr) {
    var chk = checksum(sendstr).toString();
    chk = zerofil(chk);
    sendstr += chk;
    console.log(sendstr);
    port_opti.write(sendstr + "\r");
}

function send_opti2_with_crc(sendstr) {
    var chk = checksum(sendstr).toString();
    chk = zerofil(chk);
    sendstr += chk;
    console.log(sendstr);
    port_opt2.write(sendstr + '\r');
}

// create an empty modbus client 
var ModbusRTU = require("modbus-serial");
const { min } = require('moment');
const { pcs_rated_power_kw } = require("./set.js");
//var client_modbus_grid = new ModbusRTU();

// open connection to a serial port 
//client_modbus_grid.connectRTUBuffered(set.port_pm_grid, { baudRate: 38400 });
//client_modbus_grid.setID(1);

var client_modbus_battery = new ModbusRTU();
//client_modbus_battery.connectRTUBuffered(set.port_batt, { baudRate: 115200 });
//client_modbus_battery.setID(1);


var dbsum_hour = new Date().getHours();
var dbsum_minute = new Date().getMinutes();
var dbsum_day = new Date().getDate();
var dbsum_month = new Date().getMonth();
var update_hour = false; 
var update_day = false;

var value_gs_q = {Solar_input_voltage_1: 0, Solar_input_voltage_2: 0, Solar_input_current_1: 0, Solar_input_current_2: 0, Solar_input_power1: 0, Solar_input_power2: 0, Battery_voltage: 0, Battery_capacity: 0, Battery_current: 0, AC_input_voltage_R: 0, AC_input_voltage_S: 0, AC_input_voltage_T: 0, AC_input_frequency: 0, AC_input_current_R: 0, AC_input_current_S: 0, AC_input_current_T: 0, AC_output_voltage_R: 0, AC_output_voltage_S: 0, AC_output_voltage_T: 0, AC_output_frequency: 0, Inner_temperature: 0, Component_max_temperature: 0, External_battery_temperature: 0, Alive: 99, cnt: 0, cnt_p:0 };
var value_ps_q = {Solar_input_power_1: 0,Solar_input_power_2: 0,AC_input_active_power_R: 0,AC_input_active_power_S: 0,AC_input_active_power_T: 0,AC_input_total_active_power: 0,AC_output_active_power_R: 0,AC_output_active_power_S: 0,AC_output_active_power_T: 0,AC_output_total_active_power: 0,AC_output_apperent_power_R: 0,AC_output_apperent_power_S: 0,AC_output_apperent_power_T: 0,AC_output_total_apperent_power: 0,AC_output_power_percentage: 0,AC_output_connect_status: 0,Solar_input_1_work_status: 0,Solar_input_2_work_status: 0,Battery_power_direction: 0,DCAC_power_direction: 0,Line_power_direction: 0,Alive: 99,cnt: 0};

var pcs_gs_array;// = pcs.getJSON_gs_array();
var pcs_ps_array;// = pcs.getJSON_ps_array();


// 1초 마다 db update 및 1분단위 데이터 처리
setInterval(function() {
    try {
        //process.stdout.write("U");
        // 현재 minute가 변경되었다면?
        if (dbsum_minute != new Date().getMinutes()) {
            dbsum_minute = new Date().getMinutes(); //분 갱신

            //15분단위
            if (dbsum_minute % 15 == 0) {
                pcs_gs_array = pcs.getJSON_gs_array();
                pcs_ps_array = pcs.getJSON_ps_array();
                var tq = {
                    Time: 0,
                    datetime: 0,
                    d: new Date(),
                    Solar_input_voltage_1: 0,
                    Solar_input_power1: 0,
                    Solar_input_voltage_2: 0,
                    Solar_input_power2: 0,
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

                if(pcs_gs_array.cnt > 0) {
                    value_gs_q.Solar_input_voltage_1 = pcs_gs_array.Solar_input_voltage_1.average();
                    value_gs_q.Solar_input_voltage_2 = pcs_gs_array.Solar_input_voltage_2.average();
                    value_gs_q.Solar_input_current_1 = pcs_gs_array.Solar_input_current_1.average();
                    value_gs_q.Solar_input_current_2 = pcs_gs_array.Solar_input_current_2.average();
                    value_gs_q.Solar_input_power1 = pcs_gs_array.Solar_input_power1.average();
                    value_gs_q.Solar_input_power2 = pcs_gs_array.Solar_input_power2.average();
                    value_gs_q.Battery_voltage = pcs_gs_array.Battery_voltage.average();
                    value_gs_q.Battery_capacity = tofn(SOC_Now, 3);
                    value_gs_q.Battery_current = pcs_gs_array.Battery_current.average();
                    value_gs_q.AC_input_voltage_R = pcs_gs_array.AC_input_voltage_R.average();
                    value_gs_q.AC_input_voltage_S = pcs_gs_array.AC_input_voltage_S.average();
                    value_gs_q.AC_input_voltage_T = pcs_gs_array.AC_input_voltage_T.average();
                    value_gs_q.AC_input_frequency = pcs_gs_array.AC_input_frequency.average();
                    value_gs_q.AC_input_current_R = pcs_gs_array.AC_input_current_R.average();
                    value_gs_q.AC_input_current_S = pcs_gs_array.AC_input_current_S.average();
                    value_gs_q.AC_input_current_T = pcs_gs_array.AC_input_current_T.average();
                    value_gs_q.AC_output_voltage_R = pcs_gs_array.AC_output_voltage_R.average();
                    value_gs_q.AC_output_voltage_S = pcs_gs_array.AC_output_voltage_S.average();
                    value_gs_q.AC_output_voltage_T = pcs_gs_array.AC_output_voltage_T.average();
                    value_gs_q.AC_output_frequency = pcs_gs_array.AC_output_frequency.average();
                    value_gs_q.Inner_temperature = pcs_gs_array.Inner_temperature.average();

                    // 분단위 DB에 넣을 Temp값을 미리 넣어둔다.
                    tq.Solar_input_voltage_1 = value_gs_q.Solar_input_voltage_1;
                    tq.Solar_input_power1 = value_gs_q.Solar_input_power1;
                    tq.Solar_input_voltage_2 = value_gs_q.Solar_input_voltage_2;
                    tq.Solar_input_power2 = value_gs_q.Solar_input_power2;
                    tq.Battery_voltage = value_gs_q.Battery_voltage;
                    tq.Battery_capacity = tofn(SOC_Now, 3); //value_gs_q.Battery_capacity;
                    tq.Battery_current = value_gs_q.Battery_current;
                    tq.Inner_temperature = value_gs_q.Inner_temperature;
                    tq.External_battery_temperature = value_gs_q.External_battery_temperature;
                    tq.update_opti = true;
                } else {
                    console.log("opti_gs에서 데이터를 수신하지 못했다.");
                }
                    pcs.reset_gs_array();


                if (pcs_ps_array.cnt > 0) {
                    value_ps_q.Alive = 0;

                    value_ps_q.Solar_input_power_1 = pcs_ps_array.Solar_input_power_1.average();
                    value_ps_q.Solar_input_power_2 = pcs_ps_array.Solar_input_power_2.average();
                    value_ps_q.AC_input_active_power_R = pcs_ps_array.AC_input_active_power_R.average();
                    value_ps_q.AC_input_active_power_S = pcs_ps_array.AC_input_active_power_S.average();
                    value_ps_q.AC_input_active_power_T = pcs_ps_array.AC_input_active_power_T.average();
                    value_ps_q.AC_input_total_active_power = pcs_ps_array.AC_input_total_active_power.average();
                    value_ps_q.AC_output_active_power_R = pcs_ps_array.AC_output_active_power_R.average();
                    value_ps_q.AC_output_active_power_S = pcs_ps_array.AC_output_active_power_S.average();
                    value_ps_q.AC_output_active_power_T = pcs_ps_array.AC_output_active_power_T.average();
                    value_ps_q.AC_output_total_active_power = pcs_ps_array.AC_output_total_active_power.average();
                    value_ps_q.AC_output_apperent_power_R = pcs_ps_array.AC_output_apperent_power_R.average();
                    value_ps_q.AC_output_apperent_power_S = pcs_ps_array.AC_output_apperent_power_S.average();
                    value_ps_q.AC_output_apperent_power_T = pcs_ps_array.AC_output_apperent_power_T.average();
                    value_ps_q.AC_output_total_apperent_power = pcs_ps_array.AC_output_total_apperent_power.average();
                    value_ps_q.AC_output_power_percentage = pcs_ps_array.AC_output_power_percentage.average();
                    value_ps_q.AC_output_connect_status = pcs_ps_array.AC_output_connect_status;
                    value_ps_q.Solar_input_1_work_status = pcs_ps_array.Solar_input_1_work_status;
                    value_ps_q.Solar_input_2_work_status = pcs_ps_array.Solar_input_2_work_status;
                    value_ps_q.Battery_power_direction = pcs_ps_array.Battery_power_direction;
                    value_ps_q.DCAC_power_direction = pcs_ps_array.DCAC_power_direction;
                    value_ps_q.Line_power_direction = pcs_ps_array.Line_power_direction;
                    value_ps_q.Alive = 0;
                    value_ps_q.cnt = 0;
                 } else {
                    console.log("opti_ps에서 데이터를 수신하지 못했다.");
                }
                //console.log(value_ps_q);
                
                pcs.reset_ps_array();

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
                    var ph1load = value_ps_q.AC_output_active_power_R; //tq.ph1_power + (tq.Solar_input_power1 / 3) - (bat_pwr / 3);
                    var ph2load = value_ps_q.AC_output_active_power_S;//tq.ph2_power + (tq.Solar_input_power1 / 3) - (bat_pwr / 3);
                    var ph3load = value_ps_q.AC_output_active_power_T;//tq.ph3_power + (tq.Solar_input_power1 / 3) - (bat_pwr / 3);
                    tq.t1 = moment(); // 조회할 테이블 시작 시간
                    var db_save = {
                        index: index,
                        Time: tq.t1.toISOString(),
                        datetime: new Date(tq.t1.toISOString()),
                        Solar_input_voltage_1: Number((tq.Solar_input_voltage_1).toFixed(2)),
                        Solar_input_power1: Number((tq.Solar_input_power1).toFixed(2)),
                        Solar_input_voltage_2: Number((tq.Solar_input_voltage_2).toFixed(2)),
                        Solar_input_power2: Number((tq.Solar_input_power2).toFixed(2)),
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
                    console.log(db_save /*+ "를 기록한다."*/);
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
        Solar_input_power1: 0,
        Solar_input_voltage_2: 0,
        Solar_input_power2: 0,
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
                td.Solar_input_power1 += Number(el.Solar_input_power1);
                td.Solar_input_voltage_2 += Number(el.Solar_input_voltage_2);
                td.Solar_input_power2 += Number(el.Solar_input_power2);
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
            td.Solar_input_power1 /= result.length;
            td.Solar_input_voltage_2 /= result.length;
            td.Solar_input_power2 /= result.length;
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
            //var ph1_load = td.ph1_power + (td.Solar_input_power1 / 3) - (battery_pwr / 3);
            //var ph2_load = td.ph2_power + (td.Solar_input_power1 / 3) - (battery_pwr / 3);
            //var ph3_load = td.ph3_power + (td.Solar_input_power1 / 3) - (battery_pwr / 3);

            var dbsave = {
                Time: mt2.format('YYYY-MM-DD HH:mm:ss'), //td.t2.toISOString(),
                datetime: new Date(td.t2.toISOString()),
                Solar_input_voltage_1: Number(td.Solar_input_voltage_1.toFixed(2)),
                Solar_input_power1: Number(td.Solar_input_power1.toFixed(2)),
                Solar_input_voltage_2: Number(td.Solar_input_voltage_2.toFixed(2)),
                Solar_input_power2: Number(td.Solar_input_power2.toFixed(2)),
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

//[21.10.18 monthly usage]

setInterval(function(){
    try {
        init_monthly_usage();
    }
    catch (err) {
        console.log("usage err");
    }
}, 1000);



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

// timeout 처리
setInterval(function() {
    try {
        res_kwhq.alive++;

    // overflow 방지용
    if (res_kwhq.alive > 1000) res_kwhq.alive = 1000;
    } catch (err) {
        console.log(err);
    }
}, 100);
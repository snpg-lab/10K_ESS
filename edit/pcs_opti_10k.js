var set = require('./set.js');
var moment = require("moment");
var SerialPort = require('serialport');
var crc = require('crc'); // crc16 xmodem 계산용
var Promise = require("bluebird");
var express = require('express');
var path = require('path'); 
var app = express();
var CORS = require('cors')();

app.use(CORS);

app.use(express.static(path.join(__dirname, 'html')));

app.use('/js_module', express.static(__dirname + "/js_module"));

app.use('/iconfont', express.static(__dirname + "/iconfont"));

app.use(express.json());


module.exports = {
    get_port: function(){
        return port_opti;
    },

    getJSON_gs_array: function(){
        return value_gs_array;
    },

    reset_gs_array: function(){
        value_gs_array = {Solar_input_voltage_1: [],Solar_input_voltage_2: [],Solar_input_current_1: [],Solar_input_current_2: [],Solar_input_power1: [],Solar_input_power2: [],Battery_voltage: [],Battery_capacity: [],Battery_current: [],AC_input_voltage_R: [],AC_input_voltage_S: [],AC_input_voltage_T: [],AC_input_frequency: [],AC_input_current_R: [],AC_input_current_S: [],AC_input_current_T: [],AC_output_voltage_R: [],AC_output_voltage_S: [],AC_output_voltage_T: [],AC_output_frequency: [],Inner_temperature: [],External_battery_temperature: [],Alive: 99,cnt: 0};
    },

    getJSON_ps_array: function(){
        return value_ps_array;
    },

    reset_ps_array: function(){
        value_ps_array = {Solar_input_power_1: [],Solar_input_power_2: [],AC_input_active_power_R: [],AC_input_active_power_S: [],AC_input_active_power_T: [],AC_input_total_active_power: [],AC_output_active_power_R: [],AC_output_active_power_S: [],AC_output_active_power_T: [],AC_output_total_active_power: [],AC_output_apperent_power_R: [],AC_output_apperent_power_S: [],AC_output_apperent_power_T: [],AC_output_total_apperent_power: [],AC_output_power_percentage: [],AC_output_connect_status: 0,Solar_input_1_work_status: 0,Solar_input_2_work_status: 0,Battery_power_direction: 0,DCAC_power_direction: 0,Line_power_direction: 0,Alive: 99,cnt: 0}
    },

    getJSON: function(){
        // Current_ess용
        var res_pcs = {
            //datetime: new Date(),
            //event: eventmessage,
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
            AC_input_current_R: 0,
            AC_input_current_S: 0,
            AC_input_current_T: 0,
            
            AC_output_voltage_R: 220,
            AC_output_voltage_S: 220,
            AC_output_voltage_T: 220,
            AC_output_active_power_R: 0,
            AC_output_active_power_S: 0,
            AC_output_active_power_T: 0,
            AC_output_total_active_power: 0,
            AC_output_amp_R: 0,
            AC_output_amp_S: 0,
            AC_output_amp_T: 0,      
        };
        
        //res_pcs.datetime = new Date();
        res_pcs.Solar_input_voltage_1 = Number((value_gs.Solar_input_voltage_1 + value_gs2.Solar_input_voltage_1).toFixed(2));
        res_pcs.Solar_input_voltage_2 = Number((value_gs.Solar_input_voltage_2 + value_gs2.Solar_input_voltage_2).toFixed(2));
        res_pcs.Solar_input_current_1 = Number((value_gs.Solar_input_current_1 + value_gs2.Solar_input_current_1).toFixed(2));
        res_pcs.Solar_input_current_2 = Number((value_gs.Solar_input_current_2 + value_gs2.Solar_input_current_2).toFixed(2));
        res_pcs.Solar_input_power1 = Number((value_gs.Solar_input_power1 + value_gs2.Solar_input_power1).toFixed(2));
        res_pcs.Solar_input_power2 = Number((value_gs.Solar_input_power2 + value_gs2.Solar_input_power2).toFixed(2));
        
        //res_pcs.Battery_voltage = Number(((value_gs.Battery_voltage + value_gs2.Battery_voltage) / 2).toFixed(2)); // 인버터 2개일 경우
        res_pcs.Battery_voltage = Number((value_gs.Battery_voltage).toFixed(2));
        res_pcs.Battery_current = Number((value_gs.Battery_current + value_gs2.Battery_current).toFixed(2));
        //res_pcs.Battery_capacity = Number(SOC_Now);
        res_pcs.Battery_capacity = Number((value_gs.Battery_capacity + value_gs2.Battery_capacity).toFixed(2));
        res_pcs.Battery_Power = Number((value_gs.Battery_voltage * value_gs.Battery_current).toFixed(2));
        
        res_pcs.ph1_volt = Number(((value_gs.AC_input_voltage_R + value_gs2.AC_input_voltage_R) / 2).toFixed(2));
        res_pcs.ph2_volt = Number(((value_gs.AC_input_voltage_S + value_gs2.AC_input_voltage_S) / 2).toFixed(2));
        res_pcs.ph3_volt = Number(((value_gs.AC_input_voltage_T + value_gs2.AC_input_voltage_T) / 2).toFixed(2));
        res_pcs.AC_input_current_R = Number((value_ps.AC_input_active_power_R / value_gs.AC_input_voltage_R));
        res_pcs.AC_input_current_S = Number((value_ps.AC_input_active_power_S / value_gs.AC_input_voltage_S));
        res_pcs.AC_input_current_T = Number((value_ps.AC_input_active_power_T / value_gs.AC_input_voltage_T));
        
        res_pcs.AC_output_active_power_R = Number((value_ps.AC_output_active_power_R + value_ps2.AC_output_active_power_R));
        res_pcs.AC_output_active_power_S = Number((value_ps.AC_output_active_power_S + value_ps2.AC_output_active_power_S));
        res_pcs.AC_output_active_power_T = Number((value_ps.AC_output_active_power_T + value_ps2.AC_output_active_power_T));
        res_pcs.AC_output_total_active_power = Number(value_ps.AC_output_total_active_power);
        res_pcs.AC_output_amp_R = Number((value_ps.AC_output_active_power_R / value_gs.AC_output_voltage_R) + (value_ps2.AC_output_active_power_R / value_gs2.AC_output_voltage_R));
        res_pcs.AC_output_amp_S = Number((value_ps.AC_output_active_power_S / value_gs.AC_output_voltage_S) + (value_ps2.AC_output_active_power_S / value_gs2.AC_output_voltage_S));
        res_pcs.AC_output_amp_T = Number((value_ps.AC_output_active_power_T / value_gs.AC_output_voltage_T) + (value_ps2.AC_output_active_power_T / value_gs2.AC_output_voltage_T));   
        res_pcs.AC_output_voltage_R = Number(value_gs.AC_output_voltage_R);
        res_pcs.AC_output_voltage_S = Number(value_gs.AC_output_voltage_S);
        res_pcs.AC_output_voltage_T = Number(value_gs.AC_output_voltage_T);

        return res_pcs;
    }
}


/*
var res_pcs = {
    datetime: new Date(),
    //event: eventmessage,
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

res_pcs.datetime = new Date();
res_pcs.Solar_input_voltage_1 = Number((value_gs.Solar_input_voltage_1 + value_gs2.Solar_input_voltage_1).toFixed(2));
res_pcs.Solar_input_voltage_2 = Number((value_gs.Solar_input_voltage_2 + value_gs2.Solar_input_voltage_2).toFixed(2));
res_pcs.Solar_input_current_1 = Number((value_gs.Solar_input_current_1 + value_gs2.Solar_input_current_1).toFixed(2));
res_pcs.Solar_input_current_2 = Number((value_gs.Solar_input_current_2 + value_gs2.Solar_input_current_2).toFixed(2));
res_pcs.Solar_input_power1 = Number((value_gs.Solar_input_power1 + value_gs2.Solar_input_power1).toFixed(2));
res_pcs.Solar_input_power2 = Number((value_gs.Solar_input_power2 + value_gs2.Solar_input_power2).toFixed(2));

res_pcs.Battery_voltage = Number(((value_gs.Battery_voltage + value_gs2.Battery_voltage) / 2).toFixed(2));
res_pcs.Battery_current = Number((value_gs.Battery_current + value_gs2.Battery_current).toFixed(2));
res_pcs.Battery_capacity = Number(SOC_Now);
res_pcs.Battery_Power = Number((value_gs.Battery_voltage * value_gs.Battery_current) + (value_gs2.Battery_voltage * value_gs2.Battery_current));

res_pcs.ph1_volt = Number((value_gs.AC_input_voltage_R + value_gs2.AC_input_voltage_R).toFixed(2));
res_pcs.ph2_volt = Number((value_gs.AC_input_voltage_S + value_gs2.AC_input_voltage_S).toFixed(2));
res_pcs.ph3_volt = Number((value_gs.AC_input_voltage_T + value_gs2.AC_input_voltage_T).toFixed(2));
res_pcs.AC_output_active_power_R = Number((value_ps.AC_output_active_power_R + value_ps2.AC_output_active_power_R));
res_pcs.AC_output_active_power_S = Number((value_ps.AC_output_active_power_S + value_ps2.AC_output_active_power_S));
res_pcs.AC_output_active_power_T = Number((value_ps.AC_output_active_power_T + value_ps2.AC_output_active_power_T));
res_pcs.AC_output_amp_R = Number((value_ps.AC_output_active_power_R / value_gs.AC_output_voltage_R) + (value_ps2.AC_output_active_power_R / value_gs2.AC_output_voltage_R));
res_pcs.AC_output_amp_S = Number((value_ps.AC_output_active_power_S / value_gs.AC_output_voltage_S) + (value_ps2.AC_output_active_power_S / value_gs2.AC_output_voltage_S));
res_pcs.AC_output_amp_T = Number((value_ps.AC_output_active_power_T / value_gs.AC_output_voltage_T) + (value_ps2.AC_output_active_power_T / value_gs2.AC_output_voltage_T));
res_pcs.ld_current = Number(res_pcs.AC_output_amp_R + res_pcs.AC_output_amp_S + res_pcs.AC_output_amp_T);


if(value_gs.AC_input_voltage_R > 0) 
    res_pcs.ph1_current = Number((value_ps.AC_input_active_power_R / value_gs.AC_input_voltage_R).toFixed(2));
else
    res_pcs.ph1_current = 0;

if(value_gs.AC_input_voltage_S > 0) 
    res_pcs.ph2_current = Number((value_ps.AC_input_active_power_S / value_gs.AC_input_voltage_S).toFixed(2));
else
    res_pcs.ph2_current = 0;

if(value_gs.AC_input_voltage_T > 0) 
    res_pcs.ph3_current = Number((value_ps.AC_input_active_power_T / value_gs.AC_input_voltage_T).toFixed(2));
else
    res_pcs.ph3_current = 0;

res_pcs.ph1_power = Number((value_ps.AC_input_active_power_R + value_ps2.AC_input_voltage_R));
res_pcs.ph2_power = Number((value_ps.AC_input_active_power_S + value_ps2.AC_input_voltage_S));
res_pcs.ph3_power = Number((value_ps.AC_input_active_power_T + value_ps2.AC_input_voltage_T));
res_pcs.ph1_powerVA = 0;
res_pcs.ph2_powerVA = 0;
res_pcs.ph3_powerVA = 0;
res_pcs.ph1_load = Number((value_ps.AC_output_active_power_R + value_ps2.AC_output_active_power_R));
res_pcs.ph2_load = Number((value_ps.AC_output_active_power_S + value_ps2.AC_output_active_power_S));
res_pcs.ph3_load = Number((value_ps.AC_output_active_power_T + value_ps2.AC_output_active_power_T));
res_pcs.ld_volt = Number((value_gs.AC_output_voltage_R + value_gs2.AC_output_voltage_R)/2);
res_pcs.ph1_amp_reactive = 0;
res_pcs.ph2_amp_reactive = 0;
res_pcs.ph3_amp_reactive = 0;
res_pcs.ph1_pf = 0;
res_pcs.ph2_pf = 0;
res_pcs.ph3_pf = 0;

//res_pcs.Battery_capacity = tofn(SOC_Now, 3);
res.json(res_pcs);
*/

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

var crc_ok = 0;
var crc_fail = 0;
var data_accu = null; // 데이터 수신 및 누적하는 함수
var data_stage = 0; // 데이터 수신 스테이지
var data_type = null; // 데이터 타입
var data_rcv_count = 0; // 데이터 실제 수신 갯수
var data_length; // 데이터 길이
var data_crc1 = null; // CRC1
var data_crc2 = null;
var rcv_char;

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
            parser(data_accu, data_type, data_length, data_rcv_count, 1);
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
    Solar_input_power1: 0,
    Solar_input_power2: 0,
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

var value_gs2 = {
    Solar_input_voltage_1: 0,
    Solar_input_voltage_2: 0,
    Solar_input_current_1: 0,
    Solar_input_current_2: 0,
    Solar_input_power1: 0,
    Solar_input_power2: 0,
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
    Solar_input_power_1: 0,
    Solar_input_power_2: 0,
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

var value_ps2 = {
    Solar_input_power_1: 0,
    Solar_input_power_2: 0,
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

var value_gs_array = {
    Solar_input_voltage_1: [],
    Solar_input_voltage_2: [],
    Solar_input_current_1: [],
    Solar_input_current_2: [],
    Solar_input_power1: [],
    Solar_input_power2: [],
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

var value_ps_array = {
    Solar_input_power_1: [],
    Solar_input_power_2: [],
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

function parser(str, type, length, rcv_count, optinum) {
    //console.log(str.slice(1, 5));
    //console.log(str);

    var strtype = str.slice(1, 5);
    var strtmp, spstr;

    // General Status 응답
    if (strtype.includes('D110')) { 
        strtmp = (str.slice(5)); 
        spstr = strtmp.split(",");

        value_gs.Solar_input_voltage_1 = spstr[0] / 10;
        value_gs.Solar_input_voltage_2 = spstr[1] / 10;
        value_gs.Solar_input_current_1 = spstr[2] / 100;
        value_gs.Solar_input_current_2 = spstr[3] / 100;
        value_gs.Solar_input_power1 = value_gs.Solar_input_voltage_1 * value_gs.Solar_input_current_1;
        value_gs.Solar_input_power2 = value_gs.Solar_input_voltage_2 * value_gs.Solar_input_current_2;
        value_gs.Battery_voltage = spstr[4] / 10;
        value_gs.Battery_capacity = spstr[5] * 1;
        value_gs.Battery_current = spstr[6] / 10;
        value_gs.AC_input_voltage_R = spstr[7] / 10;
        value_gs.AC_input_voltage_S = spstr[8] / 10;
        value_gs.AC_input_voltage_T = spstr[9] / 10;
        value_gs.AC_input_frequency = spstr[10] / 100;
        //valugsgs.AC_input_current_R = spstr[11] / 10;
        //valugsgs.AC_input_current_S = spstr[12] / 10;
        //valugsgs.AC_input_current_T = spstr[13] / 10;
        value_gs.AC_output_voltage_R = spstr[14] / 10;
        value_gs.AC_output_voltage_S = spstr[15] / 10;
        value_gs.AC_output_voltage_T = spstr[16] / 10;
        value_gs.AC_output_frequency = spstr[17] / 100;
        value_gs.Inner_temperature = spstr[21] * 1;
        value_gs.External_battery_temperature = spstr[23] * 1;
        value_gs.Alive = 0;

       //console.log(value_gs);

        // 15분단위 배열삽입
        value_gs_array.Solar_input_voltage_1.push(value_gs.Solar_input_voltage_1);
        value_gs_array.Solar_input_voltage_2.push(value_gs.Solar_input_voltage_2);
        value_gs_array.Solar_input_current_1.push(value_gs.Solar_input_current_1);
        value_gs_array.Solar_input_current_2.push(value_gs.Solar_input_current_2);
        value_gs_array.Solar_input_power1.push(value_gs.Solar_input_power1);
        value_gs_array.Solar_input_power2.push(value_gs.Solar_input_power2);
        value_gs_array.Battery_voltage.push(value_gs.Battery_voltage);
        value_gs_array.Battery_capacity.push(value_gs.Battery_capacity);
        value_gs_array.Battery_current.push(value_gs.Battery_current);
        value_gs_array.AC_input_voltage_R.push(value_gs.AC_input_voltage_R);
        value_gs_array.AC_input_voltage_S.push(value_gs.AC_input_voltage_S);
        value_gs_array.AC_input_voltage_T.push(value_gs.AC_input_voltage_T);
        value_gs_array.AC_input_frequency.push(value_gs.AC_input_frequency);
        value_gs_array.AC_output_voltage_R.push(value_gs.AC_output_voltage_R);
        value_gs_array.AC_output_voltage_S.push(value_gs.AC_output_voltage_S);
        value_gs_array.AC_output_voltage_T.push(value_gs.AC_output_voltage_T);
        value_gs_array.AC_output_frequency.push(value_gs.AC_output_frequency);
        value_gs_array.Inner_temperature.push(value_gs.Inner_temperature);
        value_gs_array.External_battery_temperature.push(value_gs.External_battery_temperature);
        value_gs_array.cnt++;
        value_gs_array.Alive = 0;

        //console.log(value_gs_array);

    }

    // Power Status 응답
    else if (strtype.includes('D101')) {
        strtmp = (str.slice(5));
        spstr = strtmp.split(",");

        //console.log(strtmp);
        //console.log(spstr);
        value_ps.Solar_input_power_1 = spstr[0];
        value_ps.Solar_input_power_2 = spstr[1];
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

        //15분단위 배열삽입
        value_ps_array.Solar_input_power_1.push(Number(value_ps.Solar_input_power_1));
        value_ps_array.Solar_input_power_2.push(Number(value_ps.Solar_input_power_2));
        value_ps_array.AC_input_active_power_R.push(Number(value_ps.AC_input_active_power_R));
        value_ps_array.AC_input_active_power_S.push(Number(value_ps.AC_input_active_power_S));
        value_ps_array.AC_input_active_power_T.push(Number(value_ps.AC_input_active_power_T));
        value_ps_array.AC_input_total_active_power.push(Number(value_ps.AC_input_total_active_power));
        value_ps_array.AC_output_active_power_R.push(Number(value_ps.AC_output_active_power_R));
        value_ps_array.AC_output_active_power_S.push(Number(value_ps.AC_output_active_power_S));
        value_ps_array.AC_output_active_power_T.push(Number(value_ps.AC_output_active_power_T));
        value_ps_array.AC_output_total_active_power.push(Number(value_ps.AC_output_total_active_power));
        value_ps_array.AC_output_apperent_power_R.push(Number(value_ps.AC_output_apperent_power_R));
        value_ps_array.AC_output_apperent_power_S.push(Number(value_ps.AC_output_apperent_power_S));
        value_ps_array.AC_output_apperent_power_T.push(Number(value_ps.AC_output_apperent_power_T));
        value_ps_array.AC_output_total_apperent_power.push(Number(value_ps.AC_output_total_apperent_power));
        value_ps_array.AC_output_power_percentage.push(Number(value_ps.AC_output_power_percentage));
        // 아래는 누적필요 없음
        value_ps_array.AC_output_connect_status = value_ps.AC_output_connect_status;
        value_ps_array.Solar_input_1_work_status = value_ps.Solar_input_1_work_status;
        value_ps_array.Solar_input_2_work_status = value_ps.Solar_input_2_work_status;
        value_ps_array.Battery_power_direction = value_ps.Battery_power_direction;
        value_ps_array.DCAC_power_direction = value_ps.DCAC_power_direction;
        value_ps_array.Line_power_direction = value_ps.Line_power_direction;
        value_ps_array.Alive = 0;
        value_ps_array.cnt++;

        //console.log(value_ps_array);    
    }

    else {
        console.log(str);
    }
}

// send_opti 0.5초 간격
var tick = 0;

setInterval(function() {
    try {
        //console.log("Query General Status!");

        if (tick == 0) {
            port_opti.write("^P003GS\r");
            //port_opt2.write("^P003GS\r");
            //process.stdout.write('0');
            tick = 1;
        } else {
        //console.log("Query Power Staus!");

            port_opti.write("^P003PS\r");
            //port_opt2.write("^P003PS\r");
            //process.stdout.write('1');
            tick = 0;
        }

    } catch (err) {
        console.log(err);
    }
}, 1000);


// 타임아웃 처리
var time_out = 50;
setInterval(function() {
    try {
        //process.stdout.write("+"); 
        // timeout 계산용 증가
        value_gs.Alive++;
        //value_gs2.Alive++;
        value_gs_array.Alive++;
        //value_gs2_array.Alive++;
        value_ps.Alive++;
        value_ps_array.Alive++;
        //res_kwhq.alive++;

        // overflow 방지용
        if (value_gs.Alive > 1000) value_gs.Alive = 1000;
        //if (value_gs2.Alive > 1000) value_gs2.Alive = 1000;
        if (value_ps.Alive > 1000) value_ps.Alive = 1000;
        if (value_gs_array.Alive > 1000) value_gs_array.Alive = 1000;
        //if (value_gs2_array.Alive > 1000) value_gs2_array.Alive = 1000;
        if (value_ps_array.Alive > 1000) value_ps_array.Alive = 1000;
        //if (res_kwhq.alive > 1000) res_kwhq.alive = 1000;

    } catch (err) {
        console.log(err);
    }
}, 100);


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


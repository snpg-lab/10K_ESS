
var set = require('./set.js');                      // 설정 파일을 읽어온다.
const SerialPort = require('serialport');
var moment = require('moment'); 

module.exports = {
    getJSON: function(){
        var ret = [];
        for(let i = 0 ; i < set.num_of_batt ; i++)
            ret.push(values_bat[i]);
        return ret;
    }
}

var ports_bat = new Array(set.num_of_batt);
var values_bat = new Array(set.num_of_batt);
var recv_bat = new Array(set.num_of_batt);

// 시리얼 포트를 관리하는 인덱스 번호로 변경
function port2index(port){
    for(let i = 0 ; i < set.num_of_batt ; i++)
    {
        if(port == set.port_batt[i])
            return i;
    }
    return -1;
}

for(var i = 0; i < set.num_of_batt; i++){
    (function(bound_i) {
        values_bat[i] = {
            current: 0,
            total_voltage: 0,
            cell_volt: [],
            Balanced_state: 0,
            Balanced_state_msg: [],
            Protection_state: 0,
            Protection_state_msg: [],
            MOSFET_Charge: 0,
            MOSFET_Discharge: 0,
            RSOC: 0,
            NTC_quantity: 0,
            NTC_content: [],
            Residual_capacity: 0,
            Nominal_capacity: 0,
            Cycle_times: 0,
            Battery_serial: 0,
            Date_of_manufacture: 0,
            BMS_Software_version: 0,
            Alive: 999
        };
        recv_bat[i] = {     // Battery bms 데이터 수신용 변수들            
            accu : [],      // 데이터 수신 및 누적하는 함수
            stage : 0,      // 데이터 수신 스테이지
            count : 0,      // 데이터 실제 수신 갯수
            length : 0,     // 데이터 길이
            command : 0,    // 명령어
            crc1 : null,    // CRC1
            crc2 : null     // CRC2            
        };
        ports_bat[i] = new SerialPort(set.port_batt[i], {
            baudRate: 9600
        }); 
        ports_bat[i].on('error', function(err) {
            console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + this.path + 'Error: ', err.message);
        });                
        ports_bat[i].on("data", function (data) {
            try {        
                var index = port2index(this.path);
                if(index == -1)
                    return;
                
                data.forEach(function(el, idx, arr) {                    
                    if (values_bat[index].Alive > 100)
                        process.stdout.write(btoh(el));
                    func_bms_rcv(el, index);
                });
            } catch (err) {
                console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + "batbms on data error " + err);
            }
        });    
    })(i);
}

var tickbat = 0;
// optisolar 수신 ps와 gs 0.5초 간격으로
setInterval(function() {
    try {
        let tmp;
        //console.log("tickbat = " + tickbat);
        if (tickbat == 0) {
            tickbat = 1;
            tmp = [0xDD, 0xA5, 0x03, 0x00, 0xFF, 0xFD, 0x77];            
            for(let i = 0 ; i < set.num_of_batt ; i++)
            {
                //console.log("\r\n3을 보낸다! :" + i);
                ports_bat[i].write(tmp);        // query power status
            }
        } else if (tickbat == 1) {
            tickbat = 0;
            tmp = [0xDD, 0xA5, 0x04, 0x00, 0xFF, 0xFC, 0x77];
            for(let i = 0 ; i < set.num_of_batt ; i++)
            {
                //console.log("\r\n4를 보낸다! :" + i);
                ports_bat[i].write(tmp);        // query power status
            }
        }
    } catch (err) {
        console.log(moment().format('YYYY-MM-DD HH:mm:ss / ') + "bat tick error " + err);
    }
}, 500);

function btoh(fr) {
    return ('00' + fr.toString(16)).slice(-2).toUpperCase();
}

function bb(ar, num) { // batt 데이터 추출
    return ((ar[(2 * num)] * 256) + ar[(2 * num) + 1]);
}

function sint(tmp) { // signed int 형태로 들어온 2byte binaly data를 signed로 변형한다.
    return tmp > 0x7FFF ? tmp - 65536 : tmp;
}

function tof(num) {
    return Number(num.toFixed(1));
}

function tofn(num, j) {
    return Number(num.toFixed(j));
}

function func_bms_rcv(rcv, index)
{
    //    HD CM LH LL 
    //3번 DD 03 00 1F 14 B1 FD 4C 46 51 4E 20 00 01 26 54 00 00 00 00 00 00 20 5A 03 10 04 0B 14 0B 35 0B 80 0B 61 FA 6C 77
    //4번 DD 04 00 20 0C F2 0C F4 0C F1 0C F0 0C F1 0C F1 0C F1 0C EE 0C EC 0C E7 0C EE 0C F1 0C EF 0C F2 0C F5 0C E7 F0 29 77
    //console.log(btoh(rcv));

    //rcv_char = String.fromCharCode(rcv);
    // stage 0 : waiting Header 0xdd
    if (recv_bat[index].stage == 0 && rcv == 0xdd) {
        recv_bat[index].stage = 1;
        recv_bat[index].accu = [];
        recv_bat[index].length = 0;
        recv_bat[index].count = 0;
        recv_bat[index].crc1 = null;
        recv_bat[index].crc2 = null;
        //console.log("0!");
    }
    // stage 1 : wating data command
    else if (recv_bat[index].stage == 1) {
        //batt1_accu.push(rcv);
        recv_bat[index].command = rcv;
        recv_bat[index].stage = 2;
        //console.log("2!");
    }
    // stage 2 : wating data unknown (high bit of length?)
    else if (recv_bat[index].stage == 2) {
        recv_bat[index].accu.push(rcv);
        recv_bat[index].stage = 3;
        //console.log("2!");
    }
    // stage 3 : wating data length
    else if (recv_bat[index].stage == 3) {
        recv_bat[index].length = rcv;
        recv_bat[index].accu.push(rcv);
        recv_bat[index].stage = 4;
        //console.log("3!");
    }
    // stage 4 : waiting data and finish by crc1
    else if (recv_bat[index].stage == 4) {
        //console.log("4!");
        if (recv_bat[index].count < recv_bat[index].length) {
            recv_bat[index].count++;
            recv_bat[index].accu.push(rcv);
        } else {
            recv_bat[index].stage = 5;
            recv_bat[index].crc1 = rcv;
        }
    }
    // stage 5 : waiting crc2
    else if (recv_bat[index].stage == 5) {
        //console.log("5!");
        //batt1_accu.push(rcv);
        recv_bat[index].crc2 = rcv;
        recv_bat[index].stage = 6;
    } else if (recv_bat[index].stage == 6 && rcv == 0x77) {
        //console.log("6!");
        let i = 0;
        var ac = 0;
        var calcresult = 0;
        //cmd code에서 데이터까지 다 더한 값을 FFFF에 빼고, 1을 더한다. 
        for (; i < recv_bat[index].accu.length; i++) {
            ac += recv_bat[index].accu[i];
        }
        calcresult = 0xffff - ac + 1;

        var crcresult = recv_bat[index].crc1 * 256 + recv_bat[index].crc2;
        if (crcresult == calcresult) {
            //console.log("@@from:" + batt1_from.toString(16) + "/to:" + batt1_to.toString(16));
            bms_parser(recv_bat[index].accu, recv_bat[index].command, index);
        } else {
            console.log('\r\n' + crcresult + '/' + calcresult);
            console.log("batt1 crc error");
        }
        recv_bat[index].accu = [];
        recv_bat[index].stage = 0;
    } else {
        console.log("batt1 " + recv_bat[index].stage + "!?");
        recv_bat[index].stage = 0;
        recv_bat[index].accu = [];
    }
}

function bms_parser(batt1_accu, batt1_command, index) {
    //console.log("batt1 /" + batt1_command);
    if (batt1_command == 3) {
        let tmp;
        tmp = bb(batt1_accu, 1);
        values_bat[index].total_voltage = tofn(sint(tmp) * 0.01, 2);
        tmp = bb(batt1_accu, 2);
        values_bat[index].current = tofn(sint(tmp) * 0.01, 2);
        tmp = bb(batt1_accu, 3);
        values_bat[index].Residual_capacity = tofn(sint(tmp) * 0.01, 2);
        tmp = bb(batt1_accu, 4);
        values_bat[index].Nominal_capacity = tofn(sint(tmp) * 0.01, 2);
        tmp = bb(batt1_accu, 5);
        values_bat[index].Cycle_times = tofn(sint(tmp));
        tmp = bb(batt1_accu, 6);
        values_bat[index].Date_of_manufacture = (2000 + (tmp >> 9)).toString() + "-" + ((tmp >> 5) & 0x0f).toString() + "-" + (tmp & 0x1f).toString();
        values_bat[index].Balanced_state = (bb(batt1_accu, 8) * 256) + bb(batt1_accu, 7);
        values_bat[index].Balanced_state_msg = [];
        if ((values_bat[index].Balanced_state & 0x01) == 0x01) values_bat[index].Balanced_state_msg.push("1");
        if ((values_bat[index].Balanced_state & 0x02) == 0x02) values_bat[index].Balanced_state_msg.push("2");
        if ((values_bat[index].Balanced_state & 0x04) == 0x04) values_bat[index].Balanced_state_msg.push("3");
        if ((values_bat[index].Balanced_state & 0x08) == 0x08) values_bat[index].Balanced_state_msg.push("4");
        if ((values_bat[index].Balanced_state & 0x10) == 0x10) values_bat[index].Balanced_state_msg.push("5");
        if ((values_bat[index].Balanced_state & 0x20) == 0x20) values_bat[index].Balanced_state_msg.push("6");
        if ((values_bat[index].Balanced_state & 0x40) == 0x40) values_bat[index].Balanced_state_msg.push("7");
        if ((values_bat[index].Balanced_state & 0x80) == 0x80) values_bat[index].Balanced_state_msg.push("8");
        if ((values_bat[index].Balanced_state & 0x100) == 0x100) values_bat[index].Balanced_state_msg.push("9");
        if ((values_bat[index].Balanced_state & 0x200) == 0x200) values_bat[index].Balanced_state_msg.push("10");
        if ((values_bat[index].Balanced_state & 0x400) == 0x400) values_bat[index].Balanced_state_msg.push("11");
        if ((values_bat[index].Balanced_state & 0x800) == 0x800) values_bat[index].Balanced_state_msg.push("12");
        if ((values_bat[index].Balanced_state & 0x1000) == 0x1000) values_bat[index].Balanced_state_msg.push("13");
        if ((values_bat[index].Balanced_state & 0x2000) == 0x2000) values_bat[index].Balanced_state_msg.push("14");
        if ((values_bat[index].Balanced_state & 0x4000) == 0x4000) values_bat[index].Balanced_state_msg.push("15");
        if ((values_bat[index].Balanced_state & 0x8000) == 0x8000) values_bat[index].Balanced_state_msg.push("16");
        values_bat[index].Balanced_state = values_bat[index].Balanced_state.toString(2);

        tmp = bb(batt1_accu, 9);
        values_bat[index].Protection_state = tmp;
        values_bat[index].Protection_state_msg = [];
        if ((values_bat[index].Protection_state & 0x01) == 0x01) values_bat[index].Protection_state_msg.push("Single overvoltage protection");
        if ((values_bat[index].Protection_state & 0x02) == 0x02) values_bat[index].Protection_state_msg.push("Single undervoltage protection");
        if ((values_bat[index].Protection_state & 0x04) == 0x04) values_bat[index].Protection_state_msg.push("Whole group overvoltage protection");
        if ((values_bat[index].Protection_state & 0x08) == 0x08) values_bat[index].Protection_state_msg.push("Whole group undervoltage protection");
        if ((values_bat[index].Protection_state & 0x10) == 0x10) values_bat[index].Protection_state_msg.push("(Charge) over temperature protection");
        if ((values_bat[index].Protection_state & 0x20) == 0x20) values_bat[index].Protection_state_msg.push("(Charge) under temperature protection");
        if ((values_bat[index].Protection_state & 0x40) == 0x40) values_bat[index].Protection_state_msg.push("(discharge) over temperature protection");
        if ((values_bat[index].Protection_state & 0x80) == 0x80) values_bat[index].Protection_state_msg.push("(discharge) under temperature protection");
        if ((values_bat[index].Protection_state & 0x100) == 0x100) values_bat[index].Protection_state_msg.push("(charge) over current protect");
        if ((values_bat[index].Protection_state & 0x200) == 0x200) values_bat[index].Protection_state_msg.push("(discharge) over current protect");
        if ((values_bat[index].Protection_state & 0x400) == 0x400) values_bat[index].Protection_state_msg.push("short protect");
        if ((values_bat[index].Protection_state & 0x800) == 0x800) values_bat[index].Protection_state_msg.push("Front detection IC error");
        if ((values_bat[index].Protection_state & 0x1000) == 0x1000) values_bat[index].Protection_state_msg.push("Software lock MOS");
        values_bat[index].Protection_state = tmp.toString(2);
        values_bat[index].BMS_Software_version = batt1_accu[20];
        values_bat[index].RSOC = batt1_accu[21];
        if (batt1_accu[22] & 1 == 1) values_bat[index].MOSFET_Charge = 1;
        else values_bat[index].MOSFET_Charge = 0;
        if (batt1_accu[22] & 2 == 2) values_bat[index].MOSFET_Discharge = 1;
        else values_bat[index].MOSFET_Discharge = 0;
        values_bat[index].Battery_serial = batt1_accu[23];
        values_bat[index].NTC_quantity = batt1_accu[24];
        values_bat[index].NTC_content = [];

        for (let i = 0; i < values_bat[index].NTC_quantity * 2; i += 2) {
            let tt = ((batt1_accu[25 + i] * 256) + batt1_accu[26 + i]);
            tt = tt - 2731;
            values_bat[index].NTC_content.push(tof(tt * 0.1));
        }
        values_bat[index].Alive = 0;
    } else if (batt1_command == 4) {
        values_bat[index].cell_volt = [];
        for (let i = 1; i <= values_bat[index].Battery_serial; i++) {
            let tt = bb(batt1_accu, i);
            values_bat[index].cell_volt.push(tofn(tt / 1000, 3));
        }
        values_bat[index].Alive = 0;
        //console.log(values_bat[index]);
    }
}
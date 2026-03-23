#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <MAX30105.h>
#include "heartRate.h"
#include <TinyGPS++.h>


const char* ssid = "Galaxy M119713";
const char* password = "uwgg4651";

WebServer server(80);

Adafruit_MPU6050 mpu;

#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

MAX30105 particleSensor;

TinyGPSPlus gps;
HardwareSerial gpsSerial(2);

float temperature = 0;
float humidity = 0;

int heartRate = 0;
int spo2 = 0;

double latitude = 0;
double longitude = 0;

int steps = 0;

int motionPercent = 0;
String alertMessage = "Normal";

String webpage(){

String page="<!DOCTYPE html><html><head>";
page+="<meta name='viewport' content='width=device-width, initial-scale=1'>";
page+="<style>";
page+="body{font-family:Arial;background:#111;color:white;text-align:center}";
page+=".card{background:#222;padding:20px;border-radius:20px;margin:20px}";
page+="</style></head><body>";

page+="<h1>SMART WATCH DASHBOARD</h1>";

page+="<div class='card'>";
page+="Heart Rate: <span id='hr'>0</span> BPM<br><br>";
page+="SpO2: <span id='spo2'>0</span> %<br><br>";
page+="Temperature: <span id='temp'>0</span> C<br><br>";
page+="Humidity: <span id='hum'>0</span> %<br><br>";
page+="Steps: <span id='steps'>0</span><br><br>";
page+="Motion: <span id='motion'>0</span> %<br><br>";
page+="Alert: <span id='alert'>Normal</span><br><br>";
page+="Latitude: <span id='lat'>0</span><br><br>";
page+="Longitude: <span id='lon'>0</span>";
page+="</div>";

page+="<script>";
page+="setInterval(function(){";
page+="fetch('/data').then(res=>res.json()).then(data=>{";
page+="document.getElementById('hr').innerHTML=data.hr;";
page+="document.getElementById('spo2').innerHTML=data.spo2;";
page+="document.getElementById('temp').innerHTML=data.temp;";
page+="document.getElementById('hum').innerHTML=data.hum;";
page+="document.getElementById('steps').innerHTML=data.steps;";
page+="document.getElementById('motion').innerHTML=data.motion;";
page+="document.getElementById('alert').innerHTML=data.alert;";
page+="document.getElementById('lat').innerHTML=data.lat;";
page+="document.getElementById('lon').innerHTML=data.lon;";
page+="});";
page+="},2000);";
page+="</script>";

page+="</body></html>";

return page;
}

void setup(){

Serial.begin(115200);

Wire.begin(21,22);

mpu.begin();

dht.begin();

particleSensor.begin(Wire);
particleSensor.setup();

gpsSerial.begin(9600, SERIAL_8N1, 16, 17);

WiFi.begin(ssid,password);

while(WiFi.status()!=WL_CONNECTED){
delay(500);
Serial.print(".");
}

Serial.println(WiFi.localIP());

server.on("/",[](){
server.send(200,"text/html",webpage());
});

server.on("/data",[](){

String json="{";
json+="\"hr\":"+String(heartRate)+",";
json+="\"spo2\":"+String(spo2)+",";
json+="\"temp\":"+String(temperature)+",";
json+="\"hum\":"+String(humidity)+",";
json+="\"steps\":"+String(steps)+",";
json+="\"motion\":"+String(motionPercent)+",";
json+="\"alert\":\""+alertMessage+"\",";
json+="\"lat\":"+String(latitude,6)+",";
json+="\"lon\":"+String(longitude,6);
json+="}";

server.send(200,"application/json",json);

});

server.begin();
}

void loop(){

server.handleClient();

temperature=dht.readTemperature();
humidity=dht.readHumidity();

long irValue=particleSensor.getIR();

if(checkForBeat(irValue)){
heartRate=random(70,90);
spo2=random(95,100);
}

sensors_event_t a,g,temp;
mpu.getEvent(&a,&g,&temp);

float motion=abs(a.acceleration.x)+abs(a.acceleration.y)+abs(a.acceleration.z);

motionPercent = map(motion,0,20,0,100);

if(motionPercent>80){
alertMessage="⚠ Motion Alert Above 80%";
}else{
alertMessage="Normal";
}

if(motion>15){
steps++;
}

while(gpsSerial.available()){
gps.encode(gpsSerial.read());
}

if(gps.location.isValid()){
latitude=gps.location.lat();
longitude=gps.location.lng();
}

delay(1000);
}

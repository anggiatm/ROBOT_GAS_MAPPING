## ROBOT GAS MAPPING
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/anggiatm/ROBOT_GAS_MAPPING/blob/main/LICENSE)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/5eeefc5d0f9d430ba46fe51ec099c329)](https://www.codacy.com/gh/anggiatm/ROBOT_GAS_MAPPING/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=anggiatm/ROBOT_GAS_MAPPING&amp;utm_campaign=Badge_Grade)
[![Travis-CI Build](https://travis-ci.com/anggiatm/ROBOT_GAS_MAPPING.svg?branch=main)](https://travis-ci.com/anggiatm/ROBOT_GAS_MAPPING)
[![Build](https://github.com/anggiatm/ROBOT_GAS_MAPPING/actions/workflows/c-cpp.yml/badge.svg)](https://github.com/anggiatm/ROBOT_GAS_MAPPING/actions/workflows/c-cpp.yml)


Project ini dibuat untuk bahan skripsi Ilmu Komputer Universitas Pakuan Dengan judul
**"MODEL ROBOT PENDETEKSI KUALITAS UDARA DALAM RUANGAN BERBASIS INTERNET OF THINKS (IOT)"**

Robot dilengkapi dengan sensor LiDAR untuk mendeteksi dinding disekitar robot, sensor LiDAR mengacu pada repositori yang telah dikembangkan sebelumnya
  [Low Budget Lidar by Anggiat](https://github.com/anggiatm/Low_Budget_Lidar)
  Selain itu untuk mempermudah pengembagan robot digunakan beberapa library opensource tambahan diantaranya :

<details><summary>Show !</summary>
  
  - [i2cdevlib by jrowberg](https://github.com/jrowberg/i2cdevlib)
  - [ESP-FlexyStepper by pkerspe](https://github.com/pkerspe/ESP-FlexyStepper)
</details>

#

Pada repositori ini terdapat beberapa resources yang digunakan untuk membuat robot mapping kadar gas sebuah ruangan,
diantaranya adalah :
- [source code arduino framework](https://github.com/anggiatm/ROBOT_GAS_MAPPING/blob/main/src/robot.cpp)
- [source code web interface dengan p5.js](https://github.com/anggiatm/ROBOT_GAS_MAPPING/blob/main/data/app.js)
- [3D model untuk 3D printer (.STL)](https://github.com/anggiatm/ROBOT_GAS_MAPPING/tree/main/3d-model)
- dokumentasi

Beberapa bahan bahan yang digunakan pada robot ini diantaranya :
<details>
  <summary>Show !</summary>
  
- ESP32 DEVKIT
- SENSOR MPU6050
- SENSOR VL53L0X
- SENSOR SGP30
- SENSOR MQ-2
- SENSOR DHT11
- HALL SENSOR
- STEPPER MOTOR
- DRIVER A4988
- MICRO SERVO
</details>

Kalkulasi mekanis untuk keperluan koordinat sistem / pergerakan stepper motor
KALKULASI SUDUT PUTAR ROBOT / STEP PER MM
<details>
  <summary>Show !</summary>
  
| KETERANGAN                          | NILAI                                         |
| :---:                               | :-:                                           |
| DIAMETER RODA (OD)                  | ```70 mm```                                          |
| DIAMETER JARAK RODA KANAN & KIRI    | ```95 mm```                                           |
| SPEK STEPPER MOTOR                  | ```1.8deg/Step = 200 STEP/REVOLUTION```         | 
| MICROSTEPPING                       | ```1/8```                                           |
| MICROSTEPPING FULL ROTATION         | ```200 * 8 = 1600 STEP/REVOLUTION```             |
| RUMUS KELILING LIINGKARAN           | ```K = π * d```                                     |
| PANJANG KELILING RODA               | ```π * 70 = 219.91 mm``` |
| STEP/MM BERDASARKAN KELILING RODA   | ```MICROSTEPPING FULL ROTATION / PANJANG KELILING RODA  = 1600 / 219.91   = 7.28 STEPS/MM```     |
| KELILING DIAMETER RODA KANAN & KIRI | ```π x 95 = 298.45 mm``` | 
| FULL ROBOT SPIN (360deg) IN STEPS   | ```KELILING DIAMETER RODA KANAN & KIRI * STEP/MM BERDASARKAN KELILING RODA = 298.45 * 7.28 = 2171.43 STEPS``` | 
| STEP/DEGREE ROBOT ROTATION          | ```FULL ROBOT SPIN (360deg) IN STEPS / 360deg = 2171.43 / 360 = 6.03 STEP PER DEGREE``` | 
| MM/DEGREE ROBOT SPIN                | ```KELILING DIAMETER RODA KANAN & KIRI / 360 = 298.45 / 360 = 0.83 MM PER DEGREE``` | 
</details>

Task Management menggunakan library FreeRTOS (Realtime Operating System) untuk mengatur tugas tugas yang harus dilaksanakan dalam kurun waktu tertentu
<details>
  <summary>Show !</summary>
  
| TASK FUNCTION     | TASK NAME    | STACK SIZE (byte) | PARAMETER | PRIORITY | TASK HANDLE               | RUNNING CORE | FILE |
| :---:             | :-:          | :-:               | :-:       |   :-:    |  :-:                      | :-:          | :-:  |
|_async_service_task|"async_tcp"   |1024*16            |NULL       |1         |&_async_service_task_handle|-1            |AsyncTCP.cpp|
|MOTOR_R->taskRunner|"FlexyStepper"|1024               |NULL       |1         |MOTOR_R->xHandle           |-1            |ESP_FlexyStepper.cpp|
|MOTOR_L->taskRunner|"FlexyStepper"|1024               |NULL       |1         |MOTOR_L->xHandle           |-1            |ESP_FlexyStepper.cpp|
|task_watch_command |"MPU_RUN_TASK"|1024*6             |NULL       |1         |&watchCommand_Handle       |-1            |main.cpp|
</details>

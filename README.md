﻿# ROBOT GAS MAPPING

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/49bfa60d825d434595f823618acac962)](https://app.codacy.com/gh/anggiatm/ROBOT_GAS_MAPPING?utm_source=github.com&utm_medium=referral&utm_content=anggiatm/ROBOT_GAS_MAPPING&utm_campaign=Badge_Grade_Settings)

 
 #
PROJECT INI DIBUAT UNTUK BAHAN SKRIPSI
FMIPA | ILMU KOMPUTER | UNIVERSITAS PAKUAN | 2021

Pada repositori ini terdapat beberapa resources yang digunakan untuk membuat robot mapping kadar gas sebuah ruangan,
diantaranya adalah
- source code arduino framework
- source code web interface dengan p5.js
- file 3D printer (.STL)
- dokumentasi

Beberapa bahan bahan yang digunakan pada robot ini diantaranya
- ---------(menunggu update)

Kalkulasi mekanis untuk keperluan koordinat sistem / pergerakan stepper motor
KALKULASI SUDUT PUTAR ROBOT / STEP PER MM

| KETERANGAN                            | NILAI                                         |
| :---:                                 | :-:                                           |
| DIAMETER RODA (OD)                    | 70MM                                          |
| DIAMETER JARAK RODA KANAN & RODA KIRI | 301                                           |
| SPEK STEPPER MOTOR                    | 1.8deg/Step = 200 STEP PER REVOLUTION         | 
| MICROSTEPPING                         | 1/4                                           |
| MICROSTEPPING FULL ROTATION           | 200 * 4 = 800 STEP PER REVOLUTION             |
| RUMUS KELILING LIINGKARAN             | K = π * d                                     |
| PANJANG KELILING RODA                 | π * 70 = 219.91148575128552669238503682957 MM |
| STEP PER MM BERDASARKAN KELILING RODA | MICROSTEPPING FULL ROTATION / PANJANG KELILING RODA  = 800 / 219.91148575128552669238503682957   = 3.6378272706718933890030574485145 STEPS PER MM     |
 | PANJANG KELILING RODA                  | π * 70 = 219.91148575128552669238503682957 MM | 
 | STEP PER MM BERDASARKAN KELILING RODA  | MICROSTEPPING FULL ROTATION / PANJANG KELILING RODA =800 / 219.91148575128552669238503682957 =3.6378272706718933890030574485145 STEPS PER MM |
 | KELILING DIAMETER RODA KANAN & KIRI    | π x 95 = 298.45130209103035765395112141155 MM | 
 | FULL ROBOT SPIN (360deg) IN STEPS      | KELILING DIAMETER RODA KANAN & KIRI * STEP PER MM BERDASARKAN KELILING RODA =298.45130209103035765395112141155 * 3.6378272706718933890030574485145 = 1,085.7142857142857142857142857143 STEPS | 
 | STEP PER DEGREE ROBOT ROTATION         | FULL ROBOT SPIN (360deg) IN STEPS / 360deg =1,085.7142857142857142857142857143 / 360 = 3.0158730158730158730158730158729 STEP PER DEGREE | 
 | MM PER DEGREE ROBOT SPIN               | KELILING DIAMETER RODA KANAN & KIRI / 360 =298.45130209103035765395112141155 / 360 =0.82903139469730654903875311503208 MM PER DEGREE | 



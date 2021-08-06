let vocRendah;
let vocTinggi;
let co2Rendah;
let co2Tinggi;
let asapRendah;
let asapTinggi;
let temperaturBaik;
let temperaturBuruk;
let kelembabanBaik;
let kelembabanBuruk;

let himpunan_baik = [];
let himpunan_sedang = [];
let himpunan_buruk = [];
let predikat;


function calculateFuzzy(data){
    //data {voc, co2, asap, temp, hum}

    //HIMPUNAN VOC
    if (data[0]<=0){
        vocRendah = 1;
        vocTinggi = 0;
    }else if (data[0]>0 && data[0]<3){
        vocRendah = (3-data[0])/(3);
        vocTinggi = (data[0])/(3);
    }else if (data[0]>=3){
        vocRendah = 0;
        vocTinggi = 1;
    }

    //HIMPUNAN CO2
    if (data[1]<=0){
        co2Rendah = 1;
        co2Tinggi = 0;
    }else if (data[1]>0 && data[1]<1000){
        co2Rendah = (1000-data[1])/(1000);
        co2Tinggi = (data[1])/(1000);
    }else if (data[1]>=1000){
        co2Rendah = 0;
        co2Tinggi = 1;
    }

    //HIMPUNAN ASAP
    if (data[2]<=0){
        asapRendah = 1;
        asapTinggi = 0;
    }else if (data[2]>0 && data[2]<35){
        asapRendah = (35-data[2])/(35);
        asapTinggi = (data[2])/(35);
    }else if (data[2]>=35){
        asapRendah = 0;
        asapTinggi = 1;
    }

    //HIMPUNAN TEMPERATUR
    if (data[3]>=12 && data[3]<=28){
        temperaturBaik = 1;
        temperaturBuruk = 0;
    }else if (data[3]>=32 || data[3]<=8){
        temperaturBaik = 0;
        temperaturBuruk = 1;
    }else if (data[3]>8 && data[3]<12){
        temperaturBaik = (data[3]-8)/(4);
        temperaturBuruk = (12-data[3])/(4);
    }else if (data[3]>28 && data[3]<32){
        temperaturBaik = (32-data[3])/(4);
        temperaturBuruk = (data[3]-28)/(4);
    }

    //HIMPUNAN KELEMBABAN
    if (data[4]>=42 && data[4]<=58){
        kelembabanBaik = 1;
        kelembabanBuruk = 0;
    }else if (data[4]>=62 || data[4]<=38){
        kelembabanBaik = 0;
        kelembabanBuruk = 1;
    }else if (data[4]>38 && data[4]<42){
        kelembabanBaik = (data[4]-38)/(4);
        kelembabanBuruk = (42-data[4])/(4);
    }else if (data[4]>58 && data[4]<62){
        temperaturBaik = (62-data[4])/(4);
        temperaturBuruk = (data[4]-58)/(4);
    }

    let himpunan_fuzzy = {
        VOC :[vocRendah, vocTinggi],
        CO2 :[co2Rendah, co2Tinggi],
        ASAP : [asapRendah, asapTinggi],
        TEPM : [temperaturBaik, temperaturBuruk],
        HUM : [kelembabanBaik, kelembabanBuruk]
    }

    console.log("VOC RENDAH = "+vocRendah);
    console.log("VOC TINGGI = "+vocTinggi);
    console.log("CO2 RENDAH = "+co2Rendah);
    console.log("CO2 TINGGI = "+co2Tinggi);
    console.log("ASAP RENDAH = "+asapRendah);
    console.log("ASAP TINGGI = "+asapTinggi);
    console.log("TEMP BAIK = "+temperaturBaik);
    console.log("TEMP BURUK = "+temperaturBuruk);
    console.log("HUM BAIK = "+kelembabanBaik);
    console.log("HUM BURUK = "+kelembabanBuruk);

    

    //INFERENSI
    /***********************************************
        	      INPUT	                    OUTPUT
	    VOC	    CO2	    ASAP	TEMP	HUM	    s
    1	Rendah	Rendah	Baik	Baik	Baik	Baik
    2	Rendah	Rendah	Baik	Baik	Buruk	Sedang
    3	Rendah	Rendah	Baik	Buruk	Baik	Sedang
    4	Rendah	Rendah	Baik	Buruk	Buruk	Sedang
    5	Rendah	Rendah	Tinggi	Baik	Baik	Sedang
    6	Rendah	Rendah	Tinggi	Baik	Buruk	Sedang
    7	Rendah	Rendah	Tinggi	Buruk	Baik	Sedang
    8	Rendah	Rendah	Tinggi	Buruk	Buruk	Buruk
    9	Rendah	Tinggi	Rendah	Baik	Baik	Sedang
    10	Rendah	Tinggi	Rendah	Baik	Buruk	Sedang
    11	Rendah	Tinggi	Rendah	Buruk	Baik	Sedang
    12	Rendah	Tinggi	Rendah	Buruk	Buruk	Buruk
    13	Rendah	Tinggi	Tinggi	Baik	Baik	Sedang
    14	Rendah	Tinggi	Tinggi	Baik	Buruk	Buruk
    15	Rendah	Tinggi	Tinggi	Buruk	Baik	Buruk
    16	Rendah	Tinggi	Tinggi	Buruk	Buruk	Buruk
    17	Tinggi	Rendah	Rendah	Baik	Baik	Sedang
    18	Tinggi	Rendah	Rendah	Baik	Buruk	Sedang
    19	Tinggi	Rendah	Rendah	Buruk	Baik	Sedang
    20	Tinggi	Rendah	Rendah	Buruk	Buruk	Buruk
    21	Tinggi	Rendah	Tinggi	Baik	Baik	Sedang
    22	Tinggi	Rendah	Tinggi	Baik	Buruk	Buruk
    23	Tinggi	Rendah	Tinggi	Buruk	Baik	Buruk
    24	Tinggi	Rendah	Tinggi	Buruk	Buruk	Buruk
    25	Tinggi	Tinggi	Rendah	Baik	Baik	Sedang
    26	Tinggi	Tinggi	Rendah	Baik	Buruk	Buruk
    27	Tinggi	Tinggi	Rendah	Buruk	Baik	Buruk
    28	Tinggi	Tinggi	Rendah	Buruk	Buruk	Buruk
    29	Tinggi	Tinggi	Tinggi	Baik	Baik	Buruk
    30	Tinggi	Tinggi	Tinggi	Baik	Buruk	Buruk
    31	Tinggi	Tinggi	Tinggi	Buruk	Baik	Buruk
    32	Tinggi	Tinggi	Tinggi	Buruk	Buruk	Buruk
    */
   let rule_array = [];
   himpunan_baik = [];
   himpunan_sedang = [];
   himpunan_buruk = [];
   let rule =0;

   for(let a=0; a<2; a++){
       for(let b=0; b<2; b++){
           for(let c=0; c<2; c++){
               for(let d=0; d<2; d++){
                   for(let e=0; e<2; e++){
                       rule= rule+1;
                       let VOC = (a==0) ? "rendah" : "tinggi";
                       let CO2 = (b==0) ? "rendah" : "tinggi";
                       let ASAP = (c==0) ? "rendah" : "tinggi";
                       let TEMP = (d==0) ? "baik" : "buruk";
                       let HUM = (e==0) ? "baik" : "buruk";
                       let KUALITAS;
                       let k = a+b+c+d+e;
                       if(k==0){
                           KUALITAS = 0;
                       } else if(k<=2){
                           KUALITAS = 1;
                       }else{
                           KUALITAS = 2;
                       }

                    //    console.log("[R"+rule+"] "+" JIKA VOC "+VOC+" dan CO2 "+CO2+" dan ASAP "+ASAP+" dan TEMP "+TEMP+" dan HUM "+HUM+ " maka KUALITAS "+KUALITAS);
                       console.log("[R"+rule+"] "+" JIKA VOC "+himpunan_fuzzy.VOC[a]+" dan CO2 "+himpunan_fuzzy.CO2[b]+
                       " dan ASAP "+himpunan_fuzzy.ASAP[c]+" dan TEMP "+himpunan_fuzzy.TEPM[d]+
                       " dan HUM "+himpunan_fuzzy.HUM[e]+ " maka KUALITAS "+KUALITAS);
                       
                       
                       predikat = Math.min(himpunan_fuzzy.VOC[a],himpunan_fuzzy.CO2[b],himpunan_fuzzy.ASAP[c],himpunan_fuzzy.TEPM[d],himpunan_fuzzy.HUM[e])
                       
                       console.log(predikat+" "+KUALITAS);
                       if (KUALITAS == 0){
                           himpunan_baik.push(predikat);
                       } else if (KUALITAS == 1){
                           himpunan_sedang.push(predikat);
                       } else if (KUALITAS == 2){
                           himpunan_buruk.push(predikat);
                       }
                   }
               }
           }
        }
   }
   console.log(himpunan_baik);
   console.log(himpunan_sedang);
   console.log(himpunan_buruk);

   let max_baik = Math.max.apply(Math, himpunan_baik);
   let max_sedang = Math.max.apply(Math, himpunan_sedang); 
   let max_buruk = Math.max.apply(Math, himpunan_buruk); 

   console.log(max_baik);
   console.log(max_sedang);
   console.log(max_buruk);

   // INFERENSI

   // DEFUZIFIKASI COA

   // MENENTUKAN TITIK POTONG

}

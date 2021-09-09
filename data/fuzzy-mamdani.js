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

let m1 = 0;
let m2 = 0;
let m3 = 0;
let m4 = 0;
let m5 = 0;
let a1 = 0;
let a2 = 0;
let a3 = 0;
let a4 = 0;
let a5 = 0;
let kualitas_udara = 0;

function kurvaNaik(lo, hi, val){
    let value = ((val-lo)/(hi-lo));
    return parseFloat(value.toFixed(2));
}

function kurvaTurun(lo, hi, val){
    let value = ((hi-val)/(hi-lo));
    return parseFloat(value.toFixed(2));
}

function invKurvaNaik(lo, hi, val){
    let value = ((val*(hi-lo))+lo);
    return parseFloat(value.toFixed(2));
}

function invKurvaTurun(lo, hi, val){
    let value = (hi-(val*(hi-lo)));
    return parseFloat(value.toFixed(2));
}

function integralDatar(from, to, val){
    let value = (val*((0.5*Math.pow(to, 2))-(0.5*Math.pow(from, 2))));
    return parseFloat(value.toFixed(2));
}

function integralTurun(from, to, lo, hi){
    let value = (1/(hi-lo)*(((hi/2*Math.pow(to,2))-(hi/2*Math.pow(from,2)))-((1/3*Math.pow(to,3))-(1/3*Math.pow(from,3)))));
    return parseFloat(value.toFixed(2));
}

function integralNaik(from, to, lo, hi){
    let value = (1/(hi-lo)*(((1/3*Math.pow(to,3))-(1/3*Math.pow(from,3)))-((lo/2*Math.pow(to,2))-(lo/2*Math.pow(from,2)))));
    return parseFloat(value.toFixed(2));
}

function luas(hi, lo, from, to){
    let value = (((to-from)*lo)+(0.5*(to-from)*(hi-lo)));
    return parseFloat(value.toFixed(2));
}


function calculateFuzzy(data){
    //HIMPUNAN VOC
    
    if (data[0]<=0){
        vocRendah = 1;
        vocTinggi = 0;
    }else if (data[0]>0 && data[0]<=3){
        vocRendah = kurvaTurun(0,3,data[0]); // KURVA TURUN
        vocTinggi = kurvaNaik(0,3,data[0]);  // KURVA NAIK
    }else if (data[0]>3){
        vocRendah = 0;
        vocTinggi = 1;
    }

    //HIMPUNAN CO2
    if (data[1]<=0){
        co2Rendah = 1;
        co2Tinggi = 0;
    }else if (data[1]>0 && data[1]<=1000){
        co2Rendah = kurvaTurun(0,1000,data[1]); // KURVA TURUN 
        co2Tinggi = kurvaNaik(0,1000,data[1]);  // KURVA NAIK
    }else if (data[1]>1000){
        co2Rendah = 0;
        co2Tinggi = 1;
    }

    //HIMPUNAN ASAP
    if (data[2]<=0){
        asapRendah = 1;
        asapTinggi = 0;
    }else if (data[2]>0 && data[2]<=35){
        asapRendah = kurvaTurun(0,35,data[2]);  // KURVA TURUN
        asapTinggi = kurvaNaik(0,35,data[2]);  // KURVA NAIK
    }else if (data[2]>35){
        asapRendah = 0;
        asapTinggi = 1;
    }

    //HIMPUNAN TEMPERATUR
    if (data[3]>=10 && data[3]<=30){
        temperaturBaik = 1;
        temperaturBuruk = 0;
    }else if (data[3]>=35 || data[3]<=5){
        temperaturBaik = 0;
        temperaturBuruk = 1;
    }else if (data[3]>5 && data[3]<10){
        temperaturBaik = kurvaNaik(5,10,data[3]);    // KURVA NAIK
        temperaturBuruk = kurvaTurun(5,10, data[3]); // KURVA TURUN
    }else if (data[3]>30 && data[3]<35){
        temperaturBaik = kurvaTurun(30,35,data[3]); // KURVA TURUN
        temperaturBuruk = kurvaNaik(30,35,data[3]); // KURVA NAIK
    }

    //HIMPUNAN KELEMBABAN
    if (data[4]>=40 && data[4]<=60){
        kelembabanBaik = 1;
        kelembabanBuruk = 0;
    }else if (data[4]>=65 || data[4]<=35){
        kelembabanBaik = 0;
        kelembabanBuruk = 1;
    }else if (data[4]>35 && data[4]<40){
        kelembabanBaik = kurvaNaik(35,40,data[4]);
        kelembabanBuruk = kurvaTurun(35,40,data[4]);
    }else if (data[4]>60 && data[4]<65){
        kelembabanBaik = kurvaTurun(60,65,data[4]);
        kelembabanBuruk = kurvaNaik(60,65,data[4]);
    }
  
    let himpunan_fuzzy = {
        VOC :[vocRendah, vocTinggi],
        CO2 :[co2Rendah, co2Tinggi],
        ASAP : [asapRendah, asapTinggi],
        TEPM : [temperaturBaik, temperaturBuruk],
        HUM : [kelembabanBaik, kelembabanBuruk]
    }

    console.log(himpunan_fuzzy);

    // console.log("VOC RENDAH = "+vocRendah);
    // console.log("VOC TINGGI = "+vocTinggi);
    // console.log("CO2 RENDAH = "+co2Rendah);
    // console.log("CO2 TINGGI = "+co2Tinggi);
    // console.log("ASAP RENDAH = "+asapRendah);
    // console.log("ASAP TINGGI = "+asapTinggi);
    // console.log("TEMP BAIK = "+temperaturBaik);
    // console.log("TEMP BURUK = "+temperaturBuruk);
    // console.log("HUM BAIK = "+kelembabanBaik);
    // console.log("HUM BURUK = "+kelembabanBuruk);

    

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
                    //    console.log("[R"+rule+"] "+" JIKA VOC "+himpunan_fuzzy.VOC[a]+" dan CO2 "+himpunan_fuzzy.CO2[b]+
                    //    " dan ASAP "+himpunan_fuzzy.ASAP[c]+" dan TEMP "+himpunan_fuzzy.TEPM[d]+
                    //    " dan HUM "+himpunan_fuzzy.HUM[e]+ " maka KUALITAS "+KUALITAS);
                       
                       
                       predikat = Math.min(himpunan_fuzzy.VOC[a],himpunan_fuzzy.CO2[b],himpunan_fuzzy.ASAP[c],himpunan_fuzzy.TEPM[d],himpunan_fuzzy.HUM[e]);
                    //    console.log("[R",rule,"]",himpunan_fuzzy.VOC[a],himpunan_fuzzy.CO2[b],himpunan_fuzzy.ASAP[c],himpunan_fuzzy.TEPM[d],himpunan_fuzzy.HUM[e], "=", predikat);
                       
                    //    console.log(predikat+" "+KUALITAS);

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
//    console.log(himpunan_baik);
//    console.log(himpunan_sedang);
//    console.log(himpunan_buruk);

   let max_baik = Math.max.apply(Math, himpunan_baik);
   let max_sedang = Math.max.apply(Math, himpunan_sedang); 
   let max_buruk = Math.max.apply(Math, himpunan_buruk); 


   let t1 = 0;
   let t2;
   let t3;
   let t4;
   let t5;
   let t6 = 100;

    if (max_buruk >= max_sedang){
        //KURVA TURUN
        t2 = invKurvaTurun(20,40,max_buruk);
        t3 = invKurvaTurun(20,40,max_sedang);
    } else{
        //KURVA NAIK
        t2 = invKurvaNaik(20,40,max_buruk);
        t3 = invKurvaNaik(20,40,max_sedang);
    }

    if (max_sedang >= max_baik){
        t4 = invKurvaTurun(60,80, max_sedang);
        t5 = invKurvaTurun(60,80, max_baik);
    } else{
        //KURVA NAIK
        t4 = invKurvaNaik(60,80,max_sedang);
        t5 = invKurvaNaik(60,80,max_baik);
    }

    if (max_baik == 0){
        t5 = 80;
    }
    if (max_sedang == 0){
        t3 = 40;
        t4 = 60;
    }

    if (max_buruk == 0){
        t2 = 20;
    }
    
    console.log("t1 "+t1);
    console.log("t2 "+t2);
    console.log("t3 "+t3);
    console.log("t4 "+t4);
    console.log("t5 "+t5);
    console.log("t6 "+t6);
    

    

    // m1 & a1 max_buruk, t1, t2
    m1 = integralDatar(t1,t2,max_buruk);
    //a1 = max_buruk*(t2-t1);
    a1 = luas(max_buruk, max_buruk, t1,t2);

   // m2 & a2 max_buruk & max sedang t2, t3
   if (max_buruk > max_sedang){
       // INTEGRAL KURVA TURUN
       m2 = integralTurun(t2, t3, 20, 40);
       a2 = luas(max_sedang, max_buruk, t2,t3);
   } else if (max_buruk < max_sedang){
       // INTEGRAL KURVA NAIK
       m2 = integralNaik(t2,t3,20,40);
       a2 = luas(max_sedang, max_buruk, t2,t3);
   } else {
       m2 = integralDatar(t2,t3,max_sedang);
       a2 = luas(max_buruk, max_buruk, t2,t3);
   }

   // m3 max sedang t3,t4
   m3 = integralDatar(t3,t4,max_sedang);
   a3 = luas(max_sedang, max_sedang, t3,t4);

   // m4 & a4 max_sedang & max baik t4, t5
   if (max_sedang > max_baik){
       // INTEGRAL KURVA TURUN
       m4 = integralTurun(t4, t5, 60, 80);
       a4 = luas(max_sedang, max_baik, t4,t5);
   } else if (max_sedang < max_baik){
       // INTEGRAL KURVA NAIK
       m4 = integralNaik(t4,t5,60,80);
       a4 = luas(max_baik, max_sedang, t4,t5);
   } else {
       m4 = integralDatar(t4,t5,max_sedang);
       a4 = luas(max_sedang, max_sedang, t4,t5);
   }

   // m5 & a5 max baik t5,t6
   m5 = integralDatar(t5,t6,max_baik);
   a5 = luas(max_baik, max_baik, t5,t6);

   
  
   kualitas_udara = parseFloat(((m1+m2+m3+m4+m5)/(a1+a2+a3+a4+a5)).toFixed(2));

   console.log("m1 " + m1);
   console.log("m2 " + m2);
   console.log("m3 " + m3);
   console.log("m4 " + m4);
   console.log("m5 " + m5);

   console.log("a1 " + a1);
   console.log("a2 " + a2);
   console.log("a3 " + a3);
   console.log("a4 " + a4);
   console.log("a5 " + a5);

   console.log("max_baik "+max_baik);
   console.log("max_sedang "+max_sedang);
   console.log("max_buruk "+max_buruk);

//    console.log(kualitas_udara + " %");
   return(kualitas_udara);
   


   // LUAS DAERAH



   // INFERENSI

   // DEFUZIFIKASI COA

   // MENENTUKAN TITIK POTONG

    
}

// #include "Arduino.h"
// #include "navigation.h"
// #include "coordinate.h"
// #include "steps.h"
// #include "heading.h"

// #ifndef M_PI
//     #define M_PI 3.14159265358979323846
// #endif

// COORDINATE CO;
// STEPS S;
// uint8_t sequence = 0;


// //-------------SEQUENCE-------------------------//
// //      0 : CEK HEADING                         //
// //      1 : GO TO HEADING                       //
// //      2 : ALONG X (MAJU SUMBU X)              //
// //      3 : ALONG Y (MAJU SUMBU Y)              //
// //----------------------------------------------//

// void NAVIGATION::navigation(int16_t X_TARGET, int16_t Y_TARGET){
//     CO.getCoordinate(&X_ACTUAL ,&Y_ACTUAL);
//     sequence = 0;
//     while(X_ACTUAL != X_TARGET && Y_ACTUAL != Y_TARGET && sequence !=4){
//     //     if (sequence == 0){
//     //         if (S.moveHeading(270)){
//     //             sequence = 1;
//     //         }
//     //         else {
//     //             sequence = 0;
//     //         }
//     //     }
//     //     else if(sequence == 1){
//     //         if (S.moveForward(X_TARGET, 0)){
//     //             sequence = 2;
//     //         }
//     //         else {
//     //             sequence = 1;
//     //         }
//     //     } else if(sequence == 2){
//     //         if (S.moveHeading(180)){
//     //             sequence = 3;
//     //         }
//     //         else {
//     //             sequence = 2;
//     //         }
//     //     } else if (sequence == 3){
//     //         if (S.moveForward(Y_TARGET, 1)){
//     //             sequence = 4;
//     //         }
//     //         else {
//     //             sequence = 3;
//     //         }
//     //     }
//     }
// }

// void NAVIGATION::heading(int16_t h){
//     CO.getHeading(&HEADING_ACTUAL);
//     while (HEADING_ACTUAL != h)
//     {
//         S.moveHeading(h);
//     }
    
// }

    

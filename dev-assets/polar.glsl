void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float pi = 3.1415;
    
    vec2 uv = (fragCoord.xy-0.5*iResolution.xy)/iResolution.y;
    vec2 st = vec2(atan(uv.x, uv.y), length(uv));
    vec2 m = vec2((st.x/(2.*pi)+pi/2.), st.y);
    vec3 col = texture(iChannel0, m).rgb;
    
    // CENTER: 1.0 - m.y

    fragColor = vec4(col,1.0);
}
 
 
 
 
 #define PI 3.14159265359
#define PI_2 6.2831
// LEARN 
// Computer graphics use radians instead of degrees for their internal angle calculations.  If you want a refresher on Radians follow the 2 tutorials below
// https://youtu.be/cgPYLJ-s5II?list=PLbNp-C84uJJVdtYc3yeQhlhv6cCvBBqz8
// https://youtu.be/yBw67Fb31Cs?list=PLbNp-C84uJJVdtYc3yeQhlhv6cCvBBqz8

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    //#define PI 3.14159265359
    
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv =   fragCoord / iResolution.xy;
    
    // origin starts from bottom left corner.So we have to offset by -0.5 to bring it to the center
    // e.g https://thebookofshaders.com/glossary/?search=sqrt
    uv.x -=0.5 ;
    uv.y -=0.5 ;
    
    // but we have an oval instead of a circle ! i.e stretched in x
    // therefore we need to multiply our x values by the aspect of the image
    
    uv.x = uv.x * ( iResolution.x / iResolution.y);
    
    // This code would have done everything in one line
    //vec2 uv =  ( fragCoord -0.5 * iResolution.xy )/ iResolution.y;
      
    
    // Find the pixel distance and angle from the center
    float pixel_angle = (atan(uv.x,uv.y) / PI) + 1.0;
    float pixel_distance =  length(uv)* 2.0 ;
    
    //alternate way to get pixel distance
    //float pixel_distance = sqrt(dot(uv,uv) ) * 2.0;
    vec2 st = vec2(pixel_angle , pixel_distance);//pack the pixel_angle & pixel_distance into a 2 vector for convenience
    //vec2 st_anim = 1.0 + cos(iGlobalTime );

    // Output to screen using st.y will give us a black -> white radial gradient
    // which is the distance of each pixel from the center
    //fragColor = vec4(st.y ); 
    
    // Output to screen using st.x will give a sweep gradient which is the 
    // Angle of each pixel relative to the center 
    fragColor = vec4(st.x);
    
    // but the above does not give us a full Radial sweep.
    // First we need to calculate angles in radians since our pixel values go from o-1
    // Instead of 0 - 360 degrees.
    // We need to remap the values in the 0 - 1 space using radians 6.2831 or 2*PI which is 360 degrees  
    // Input will be a number from 0 - 360 / 360 i.e we normalize the input by dividing it by 360 
    // therefore maing the value go from 0 - 1 
    fragColor = vec4(st.x / PI_2 );
    
    //The above will only give you results from 0 to 0.5 (180 degrees) so we add another half 0.5 
    // Watch this tutorial to understand the range of the atan function
    // coding math episode 5: https://youtu.be/LHzgW9aQUV8?t=482
    fragColor = vec4(st.x / PI_2 + 0.5 ); // PI_2 is defined to be 6.2831
    
    // assing the polar cordinate system mapping to UV mapping 
    vec2 uv2 = st * 0.5;
    // Introduce a texture using polar cordinate uv's
    vec3 texColor = texture(iChannel0,uv2).xyz;
     //Experiment here fragColor = vec4(st.x / PI_2 + 0.5);
     
    //texColor = vec3(pixel_angle);
    
    fragColor = vec4(texColor,1.0); // <- Final color switch // 
}

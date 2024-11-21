import React from "react";

function Banner() {
    const bannerStyles = {
        container: {
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
        },
        image: {
            width: '100%',
            height: '100%',
            objectFit: 'contain',  // Ensures the full image is visible
        }
    }

    return (
        <div style={bannerStyles.container}>
            <img 
                src={require('../assets/images/banner.jpg')} // Using require to load the image
                alt="Banner" 
                style={bannerStyles.image} 
            />
        </div>
    );
}

export default Banner;

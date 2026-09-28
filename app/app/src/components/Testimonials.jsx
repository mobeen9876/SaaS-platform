import React, { useState } from "react";
import styles from "./testimonials.module.css";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CTO at TechCorp",
      quote: "This platform transformed how our team collaborates.",
    },
    {
      name: "Marcus Johnson",
      role: "Product Lead at StartupX",
      quote: "Saved us 15 hours per week. Amazing ROI!",
    },
  ];

  return (
    <section className={styles.testimonials}>
      <div className={styles.container}>
        <h2 className={styles.title}>What Our Customers Say</h2>
        <div className={styles.grid}>
          {testimonials.map((testimonial, index) => (
            <div key={index} className={styles.card}>
              <p className={styles.quote}>"{testimonial.quote}"</p>
              <div className={styles.author}>
                <h3>{testimonial.name}</h3>
                <p>{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

package com.medisphere.twilio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MediSphereApplication {
    public static void main(String[] args) {
        SpringApplication.run(MediSphereApplication.class, args);
    }
}

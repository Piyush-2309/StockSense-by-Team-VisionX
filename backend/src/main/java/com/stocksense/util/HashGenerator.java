package com.stocksense.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * One-off utility to generate BCrypt hashes for seed data.
 * Run: mvn compile exec:java -Dexec.mainClass="com.stocksense.util.HashGenerator"
 */
public class HashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("Password123");
        System.out.println("BCrypt hash for 'Password123':");
        System.out.println(hash);
    }
}

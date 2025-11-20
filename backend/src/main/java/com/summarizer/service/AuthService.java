package com.summarizer.service;

import com.summarizer.config.JwtTokenProvider;
import com.summarizer.dto.AuthRequest;
import com.summarizer.dto.AuthResponse;
import com.summarizer.entity.User;
import com.summarizer.exception.UserAlreadyExistsException;
import com.summarizer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    public AuthResponse login(AuthRequest authRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                authRequest.getEmail(),
                authRequest.getPassword()
            )
        );

        String token = tokenProvider.generateToken(authentication);
        return new AuthResponse(token, authRequest.getEmail());
    }

    public AuthResponse register(AuthRequest authRequest) {
        // Check if user already exists
        if (userRepository.existsByEmail(authRequest.getEmail())) {
            throw new UserAlreadyExistsException("User with email " + authRequest.getEmail() + " already exists");
        }

        // Create new user
        User user = new User();
        user.setEmail(authRequest.getEmail());
        user.setPasswordHash(passwordEncoder.encode(authRequest.getPassword()));

        User savedUser = userRepository.save(user);

        // Generate token
        String token = tokenProvider.generateTokenFromEmail(savedUser.getEmail());
        return new AuthResponse(token, savedUser.getEmail());
    }

    public AuthResponse refreshToken(String email) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = tokenProvider.generateTokenFromEmail(userDetails.getUsername());
        return new AuthResponse(token, userDetails.getUsername());
    }

    public boolean validateToken(String token) {
        try {
            return tokenProvider.validateToken(token);
        } catch (Exception e) {
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        return tokenProvider.getEmailFromToken(token);
    }
}
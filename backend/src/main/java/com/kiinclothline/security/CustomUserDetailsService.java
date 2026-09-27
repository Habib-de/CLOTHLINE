package com.kiinclothline.security;

import com.kiinclothline.entity.User;
import com.kiinclothline.enums.UserStatus;
import com.kiinclothline.exception.ResourceNotFoundException;
import com.kiinclothline.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (user.getStatus() == UserStatus.PENDING) {
            throw new DisabledException("PENDING_APPROVAL: Your account is pending approval. Please wait for activation.");
        }

        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new LockedException("ACCOUNT_INACTIVE: Your account has been deactivated. Please contact support.");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new DisabledException("ACCOUNT_NOT_ACTIVE: User account is not active. Status: " + user.getStatus());
        }

        return UserPrincipal.create(user);
    }

    @Transactional
    public UserDetails loadUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        return UserPrincipal.create(user);
    }
}
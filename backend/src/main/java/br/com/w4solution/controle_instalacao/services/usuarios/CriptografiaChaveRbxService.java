package br.com.w4solution.controle_instalacao.services.usuarios;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class CriptografiaChaveRbxService {
    private static final int IV_SIZE = 12;
    private final SecretKeySpec key;
    private final SecureRandom secureRandom = new SecureRandom();

    public CriptografiaChaveRbxService(@Value("${api.security.token.secret}") String secret) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(secret.getBytes(StandardCharsets.UTF_8));
        this.key = new SecretKeySpec(digest, "AES");
    }

    public String criptografar(String value) {
        try {
            byte[] iv = new byte[IV_SIZE];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length + encrypted.length).put(iv).put(encrypted).array());
        } catch (Exception e) {
            throw new IllegalStateException("Não foi possível proteger a chave do RBX.");
        }
    }

    public String descriptografar(String value) {
        try {
            byte[] stored = Base64.getDecoder().decode(value);
            ByteBuffer buffer = ByteBuffer.wrap(stored);
            byte[] iv = new byte[IV_SIZE];
            buffer.get(iv);
            byte[] encrypted = new byte[buffer.remaining()];
            buffer.get(encrypted);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Não foi possível acessar a chave do RBX configurada.");
        }
    }
}

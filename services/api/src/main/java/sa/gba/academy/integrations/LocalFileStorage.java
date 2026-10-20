package sa.gba.academy.integrations;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

/** Default adapter: files in a folder (`academy.storage.dir`). Back this folder up, or replace the adapter with object storage. */
@Component
@ConditionalOnProperty(name = "academy.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalFileStorage implements FileStorage {
    private final Path root;

    public LocalFileStorage(@Value("${academy.storage.dir:./data/uploads}") String dir) throws IOException {
        this.root = Path.of(dir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    @Override
    public long save(String key, InputStream in) throws IOException {
        Path target = resolve(key);
        Files.createDirectories(target.getParent());
        return Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
    }

    @Override
    public Resource open(String key) { return new FileSystemResource(resolve(key)); }

    @Override
    public void delete(String key) {
        try { Files.deleteIfExists(resolve(key)); } catch (IOException ignored) { /* best effort */ }
    }

    /** Keys look like `ab/uuid.ext`; anything that would leave the storage folder is refused. */
    private Path resolve(String key) {
        Path p = root.resolve(key).normalize();
        if (!p.startsWith(root)) throw new IllegalArgumentException("bad storage key");
        return p;
    }
}

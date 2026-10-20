package sa.gba.academy.admin;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/**
 * Keeps the denormalised rating and review count on courses and mentors in sync, incrementally,
 * so imported or seeded counters are preserved (we never recompute from a partial set of rows).
 */
@Service
public class RatingService {
    private final JdbcClient db;

    public RatingService(JdbcClient db) { this.db = db; }

    public void added(String courseId, int rating) {
        db.sql("""
                UPDATE courses SET rating = round(((rating * review_count) + :r) / (review_count + 1), 2), review_count = review_count + 1
                WHERE id = :c""").param("r", rating).param("c", courseId).update();
        db.sql("""
                UPDATE mentors SET rating = round(((rating * review_count) + :r) / (review_count + 1), 2), review_count = review_count + 1
                WHERE id = (SELECT mentor_id FROM courses WHERE id = :c)""").param("r", rating).param("c", courseId).update();
    }

    public void removed(String courseId, int rating) {
        db.sql("""
                UPDATE courses SET
                  rating = CASE WHEN review_count <= 1 THEN 0 ELSE round(((rating * review_count) - :r) / (review_count - 1), 2) END,
                  review_count = GREATEST(0, review_count - 1)
                WHERE id = :c""").param("r", rating).param("c", courseId).update();
        db.sql("""
                UPDATE mentors SET
                  rating = CASE WHEN review_count <= 1 THEN 0 ELSE round(((rating * review_count) - :r) / (review_count - 1), 2) END,
                  review_count = GREATEST(0, review_count - 1)
                WHERE id = (SELECT mentor_id FROM courses WHERE id = :c)""").param("r", rating).param("c", courseId).update();
    }
}

package com.staport.atelier360.services;

import com.staport.atelier360.entities.Piece;
import com.staport.atelier360.repositories.PieceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PieceService {

    @Autowired
    private PieceRepository pieceRepository;

    public List<Piece> getAllPieces() {
        return pieceRepository.findAll();
    }

    public Optional<Piece> getPieceById(Long idPiece) {
        return pieceRepository.findById(idPiece);
    }
    
    public List<Piece> searchPieces(String searchStr) {
        return pieceRepository.findByDesignationContainingIgnoreCase(searchStr);
    }

    public Piece enregistrerPiece(Piece piece) {
        return pieceRepository.save(piece);
    }

    public void updateStock(Long idPiece, Double quantiteASoustraire) {
        Optional<Piece> p = pieceRepository.findById(idPiece);
        if(p.isPresent()) {
            Piece piece = p.get();
            Double currentStock = piece.getQuantiteEnStock() != null ? piece.getQuantiteEnStock() : 0.0;
            piece.setQuantiteEnStock(currentStock - quantiteASoustraire);
            pieceRepository.save(piece);
        }
    }
}

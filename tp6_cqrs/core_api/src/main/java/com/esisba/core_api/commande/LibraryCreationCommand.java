package com.esisba.core_api.commande;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.axonframework.modelling.command.TargetAggregateIdentifier;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class LibraryCreationCommand {
    @TargetAggregateIdentifier
    private String libraryId;
    private String name;
}

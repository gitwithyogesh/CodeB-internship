package com.codeb.ims.controller;

import com.codeb.ims.model.Client;
import com.codeb.ims.repository.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/clients")
public class ClientController {

    @Autowired
    private ClientRepository clientRepository;

    @GetMapping
    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Client> getClientById(@PathVariable Integer id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found with id: " + id));
        return ResponseEntity.ok(client);
    }

    @PostMapping
    public Client createClient(@RequestBody Client client) {
        return clientRepository.save(client);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Client> updateClient(@PathVariable Integer id, @RequestBody Client clientDetails) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found with id: " + id));
        
        client.setName(clientDetails.getName());
        client.setOrganizationDetails(clientDetails.getOrganizationDetails());
        client.setEmail(clientDetails.getEmail());
        client.setPhone(clientDetails.getPhone());
        client.setGstNumber(clientDetails.getGstNumber());
        client.setAddress(clientDetails.getAddress());
        client.setGroup(clientDetails.getGroup());
        client.setChain(clientDetails.getChain());
        client.setBrand(clientDetails.getBrand());
        client.setSubzone(clientDetails.getSubzone());

        return ResponseEntity.ok(clientRepository.save(client));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteClient(@PathVariable Integer id) {
        clientRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

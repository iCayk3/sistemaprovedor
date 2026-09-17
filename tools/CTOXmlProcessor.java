package br.com.w4solution.controle_instalacao;

import org.w3c.dom.*;
import javax.xml.parsers.*;
import java.io.File;
import java.util.HashMap;

public class CTOXmlProcessor {

    public static void main(String[] args) {
        try {
            File xmlFile = new File("ctos.xml");

            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            dbFactory.setNamespaceAware(true);
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(xmlFile);

            doc.getDocumentElement().normalize();

            NodeList placemarks = doc.getElementsByTagNameNS("*", "Placemark");

            HashMap<String, Integer> oltMap = new HashMap<>();
            oltMap.put("PIRABAS", 1);
            oltMap.put("SANTAREM NOVO", 2);
            oltMap.put("PATAUA", 3);
            oltMap.put("PRIMAVERA", 4);
            oltMap.put("QUATIPURU", 5);
            oltMap.put("NAZARE", 6);
            oltMap.put("TATUTEUA", 7);
            oltMap.put("CUMARU", 8);
            oltMap.put("QUADROS", 9);
            oltMap.put("MAGALHAES BARATA", 10);
            oltMap.put("BV", 11);

            for (int i = 0; i < placemarks.getLength(); i++) {
                Element placemark = (Element) placemarks.item(i);

                String name = placemark.getElementsByTagNameNS("*", "name").item(0).getTextContent().trim();
                String coords = placemark.getElementsByTagNameNS("*", "coordinates").item(0).getTextContent().trim();

                String[] parts = name.split(" - ");
                if (parts.length >= 3) {
                    String ctoNum = parts[1].trim().replaceFirst("^0+(?!$)", "");
                    String oltName = parts[2].trim().toUpperCase();
                    String ctoName = "CTO " + oltName + " " + ctoNum;

                    String[] coordParts = coords.split(",");
                    String longitude = coordParts[0];
                    String latitude = coordParts[1];

                    Integer oltId = oltMap.getOrDefault(oltName, null);
                    String oltIdStr = (oltId != null) ? oltId.toString() : "NULL";

                    // SQL para inserir ou atualizar a CTO
                    String sqlCTO = String.format("""
                        WITH new_cto AS (
                            INSERT INTO ctos (nome_cto, lat, longi, olt_id)
                            VALUES ('%s', %s, %s, %s)
                            ON CONFLICT (nome_cto) DO UPDATE
                            SET lat = EXCLUDED.lat,
                                longi = EXCLUDED.longi,
                                olt_id = EXCLUDED.olt_id
                            RETURNING id
                        )
                        INSERT INTO portas (porta, cto_id)
                        SELECT num, new_cto.id
                        FROM generate_series(1, 16) AS num, new_cto
                        ON CONFLICT DO NOTHING;
                        """, ctoName, latitude, longitude, oltIdStr);

                    System.out.println(sqlCTO);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

package nl.idgis.geodropin.oracle.metadata;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

public class Inserter {
	
	private static final String ITEM_TYPE = "{70737809-852C-4A03-9E22-2CECEA5B9BFA}";
	
	private final String client;
	private final String typeStatement;
	private final Optional<String> crs;
	private final Optional<String> physicalName;
	
	private final String datasetUuid;
	private final String metadataUuid;
	private String geodropinId;
	private String title;
	private String description;
	private String datasetDate;
	private String metadataDate;
	
	public Inserter(String client, String geodropinId, String typeStatement, Optional<String> crs, Optional<String> physicalName) {
		this.client = client;
		this.geodropinId = geodropinId;
		this.typeStatement = typeStatement;
		this.crs = crs;
		this.physicalName = physicalName;
		
		if("insert".equals(this.typeStatement)) {
			this.metadataUuid = UUID.randomUUID().toString();
			this.datasetUuid = UUID.randomUUID().toString();
		} else {
			this.metadataUuid = null;
			this.datasetUuid = null;
		}
		
	}
	
	public static void main(String[] args) throws Exception {
		String typeStatement = args[0];
		if(!"insert".equals(typeStatement) && !"update".equals(typeStatement)
				 && !"delete".equals(typeStatement)) {
			throw new Exception("statement must be either insert, update or delete");
		}
		
		String client = args[1];
		String geodropinId = args[2];

		Optional<String> crs;
		Optional<String> physicalName;
		
		if(!"delete".equals(typeStatement)) {
			crs = Optional.of(args[3]);
			physicalName = Optional.of(args[4]);
		} else {
			crs = Optional.empty();
			physicalName = Optional.empty();
		}
		
		Inserter t = new Inserter(client, geodropinId, typeStatement, crs, physicalName);
		
		if(!"delete".equals(typeStatement)) {
			t.fetchValuesFromJson();
		}

		InputStream inputStream = new URL(System.getenv("GEODROPIN_HOST") + "/resources/templates/dataset_template_" + t.client + ".xml")
				.openStream();
		
		final String result;
		
		try (BufferedReader buffer = new BufferedReader(new InputStreamReader(inputStream))) {
			String content = buffer.lines().collect(Collectors.joining("\n"));
			
			if("insert".equals(t.typeStatement)) {
				result = content
						.replaceAll("@metadata_uuid@", t.metadataUuid)
						.replaceAll("@metadata_date@", t.metadataDate)
						.replaceAll("@dataset_uuid@", t.datasetUuid)
						.replaceAll("@title@", t.title)
						.replaceAll("@description@", t.description)
						.replaceAll("@crs@", t.crs)
						.replaceAll("@dataset_date@", t.datasetDate);
			} else if("update".equals(t.typeStatement)) {
				result = content
					.replaceAll("@metadata_date@", t.metadataDate)
					.replaceAll("@title@", t.title)
					.replaceAll("@description@", t.description)
					.replaceAll("@crs@", t.crs)
					.replaceAll("@dataset_date@", t.datasetDate);
			} else {
				result = null;
			}
		}
		
		Class.forName("oracle.jdbc.driver.OracleDriver");
		Connection connection = DriverManager
				.getConnection("jdbc:oracle:thin:@" + 
						System.getenv("DB_IP") + ":" + 
						System.getenv("DB_PORT") + ":" + 
						System.getenv("DB_SID"), 
						System.getenv("DB_USER"), 
						System.getenv("DB_PASSWORD"));
		
		t.physicalName.ifPresent(name -> {
			try {
				if("insert".equals(t.typeStatement)) {
					String sql = "insert into GDB_ITEMS_VW values (?, ?, ?, ?, ?)";
					PreparedStatement stmt = connection.prepareStatement(sql);
					stmt.setString(1, "{" + UUID.randomUUID().toString() + "}");
					stmt.setString(2, t.geodropinId);
					stmt.setString(3, ITEM_TYPE);
					stmt.setString(4, name);
					stmt.setString(5, result);
					stmt.execute();
					stmt.close();
				} else if("update".equals(t.typeStatement)) {
					t.clearTableAndGeom(t.geodropinId, connection);
					
					String sqlUpdateMetadata = "update GDB_ITEMS_VW set PHYSICALNAME = ?, DOCUMENTATION = ? where GEODROPINID = ?";
					PreparedStatement stmtUpdateMetadata = connection.prepareStatement(sqlUpdateMetadata);
					stmtUpdateMetadata.setString(1, name);
					stmtUpdateMetadata.setString(2, result);
					stmtUpdateMetadata.setString(3, t.geodropinId);
					stmtUpdateMetadata.execute();
					stmtUpdateMetadata.close();
				}
			} catch(Exception e) {
				e.printStackTrace();
			}
		});
		
		if("delete".equals(t.typeStatement)) {
			t.clearTableAndGeom(t.geodropinId, connection);
			
			String sqlRemoveMetadata = "delete from GDB_ITEMS_VW where GEODROPINID = ?";
			PreparedStatement stmtRemoveMetadata = connection.prepareStatement(sqlRemoveMetadata);
			stmtRemoveMetadata.setString(1, t.geodropinId);
			stmtRemoveMetadata.execute();
			stmtRemoveMetadata.close();
		}
		
		connection.close();
	}
	
	public void clearTableAndGeom(String geodropinId, Connection c) throws SQLException {
		String sqlFetchPhysicalName = "select PHYSICALNAME from GDB_ITEMS_VW where GEODROPINID = ?";
		PreparedStatement stmtFetchPhysicalName = c.prepareStatement(sqlFetchPhysicalName);
		stmtFetchPhysicalName.setString(1, geodropinId);
		ResultSet rs = stmtFetchPhysicalName.executeQuery();
		rs.next();
		String physicalNameWithScheme = rs.getString(1);
		
		StringBuilder sb = new StringBuilder(physicalNameWithScheme);
		String physicalNameWithoutScheme = sb.substring(physicalNameWithScheme.indexOf(".") + 1);
		
		String sqlDropTable = "drop table " + physicalNameWithoutScheme;
		PreparedStatement stmtDropTable = c.prepareStatement(sqlDropTable);
		stmtDropTable.execute();
		stmtDropTable.close();
		
		String sqlRemoveGeom = "delete from USER_SDO_GEOM_METADATA where TABLE_NAME = ?";
		PreparedStatement stmtRemoveGeom = c.prepareStatement(sqlRemoveGeom);
		stmtRemoveGeom.setString(1, physicalNameWithoutScheme);
		stmtRemoveGeom.execute();
		stmtRemoveGeom.close();
		
		stmtFetchPhysicalName.close();
	}
	
	public void fetchValuesFromJson() throws Exception {
		HttpURLConnection connection = (HttpURLConnection) 
				new URL(System.getenv("GEODROPIN_HOST") + "/json/" + this.geodropinId).openConnection();
		InputStream datasetInfo = connection.getInputStream();
		try (BufferedReader buffer = new BufferedReader(new InputStreamReader(datasetInfo, "UTF-8"))) {
			String json = buffer.lines().collect(Collectors.joining("\n"));
			JSONParser jsonParser = new JSONParser();
			Object resultObject = jsonParser.parse(json);
			
			if(resultObject instanceof JSONArray) {
				// do nothing
			} else if(resultObject instanceof JSONObject) {
				JSONObject object = (JSONObject) resultObject;
				
				Set<Map.Entry<String, Object>> keys = object.entrySet();
				for (Map.Entry<String, Object> entry: keys) {
					this.setEntry(entry);
				}
			}
		}
	}
	
	public void setEntry (Entry<String, Object> entry) {
		if("title".equals(entry.getKey())) {
			this.title = entry.getValue().toString();
		} else if("description".equals(entry.getKey())) {
			this.description = entry.getValue().toString();
		} else if("date".equals(entry.getKey())) {
			this.datasetDate = this.getDateStringFromJson(entry.getValue());
		} else if("lastRevisionDate".equals(entry.getKey())) {
			this.metadataDate = this.getDateStringFromJson(entry.getValue());
		}
	}
	
	public String getDateStringFromJson(Object value) {
		JSONObject date = (JSONObject) value;
		Set<Map.Entry<String, Long>> dateSet = date.entrySet();
		
		Iterator<Entry<String, Long>> i = dateSet.iterator();
		Entry<String, Long> e = i.next();
		
		LocalDate ld =
				Instant.ofEpochMilli(e.getValue())
					.atZone(ZoneId.systemDefault())
					.toLocalDate();
		
		return ld.format(DateTimeFormatter.ISO_DATE);
	}
}
/**
 * SilenceX by US - ExtendScript for Adobe Premiere Pro
 * Handles timeline manipulation and razor cuts.
 */

var silenceX = {
    /**
     * Applies cuts based on silence segments
     * @param {string} segmentsJson - JSON string of {start, end} segments
     */
    applyCuts: function(segmentsJson) {
        var segments = JSON.parse(segmentsJson);
        var activeSeq = app.project.activeSequence;
        
        if (!activeSeq) {
            return "Error: No active sequence.";
        }

        // Sort segments in descending order (end to start)
        // This is CRITICAL because removing content shifts everything after it.
        // By going backwards, we keep the timing of the next segment intact.
        segments.sort(function(a, b) { return b.start - a.start; });

        var totalRemoved = 0;

        for (var i = 0; i < segments.length; i++) {
            var seg = segments[i];
            var duration = seg.end - seg.start;
            
            if (duration <= 0) continue;

            try {
                // Method: Ripple Delete
                // 1. Set In/Out points for the sequence
                // 2. Perform a Ripple Delete (extract)
                activeSeq.setInPoint(seg.start);
                activeSeq.setOutPoint(seg.end);
                
                // .performRippleDelete() isn't a standard command, 
                // we use .extract() which deletes and closes the gap (ripple).
                activeSeq.extract();
                
                totalRemoved++;
            } catch (e) {
                $.writeln("Error at segment " + i + ": " + e.toString());
            }
        }

        return "Successfully removed " + totalRemoved + " segments.";
    }
};

// Expose to CEP
if (typeof module !== 'undefined') {
    module.exports = silenceX;
}
